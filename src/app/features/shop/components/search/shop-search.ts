import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';
import { EMPTY, Subject, catchError, of, switchMap, tap, timer } from 'rxjs';
import { SEARCH_INPUT_CONFIG } from '@core/constants/search-input';
import { toAppError } from '@core/models/errors/api-error.model';
import {
  HybridSearchInterpretation,
  HybridSearchResult,
} from '@core/models/search/hybrid-search.model';
import { I18nService } from '@core/services/i18n/i18n';
import { TranslatePipe, UiTextPipe } from '@core/services/i18n/translation-pipes';
import { LoggerService } from '@core/services/logger/logger';
import { HybridSearchService, HYBRID_SEARCH_LIMITS } from '@core/services/search/hybrid-search';
import { SearchInterpretation } from '@features/shop/search-interpretation/search-interpretation';
import { ProductPrice } from '@shared/components/product-price/product-price';

@Component({
  selector: 'app-shop-search',
  imports: [TranslatePipe, UiTextPipe, NgOptimizedImage, SearchInterpretation, ProductPrice],
  templateUrl: './shop-search.html',
  styleUrl: './shop-search.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShopSearch {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly searchService = inject(HybridSearchService);
  private readonly logger = inject(LoggerService);
  private readonly i18n = inject(I18nService);
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly requests = new Subject<string>();
  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');

  readonly close = output<void>();
  readonly inputConfig = SEARCH_INPUT_CONFIG;
  readonly query = signal('');
  readonly searchText = computed(() => this.query().trim());
  readonly canSearch = computed(() => this.searchText().length >= SEARCH_INPUT_CONFIG.MIN_QUERY_LENGTH);
  readonly interpretation = signal<HybridSearchInterpretation | null>(null);
  readonly primaryResults = signal<HybridSearchResult[]>([]);
  readonly relatedResults = signal<HybridSearchResult[]>([]);
  readonly results = computed(() => [...this.primaryResults(), ...this.relatedResults()]);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly selectedIndex = signal(-1);
  readonly activeOptionId = computed(() => this.selectedIndex() >= 0
    ? `shop-search-option-${this.selectedIndex()}`
    : null);
  readonly resultGroups = computed(() => [
    { label: 'catalog.yourSearchResults' as const, results: this.primaryResults(), offset: 0 },
    { label: 'catalog.relatedProducts' as const, results: this.relatedResults(), offset: this.primaryResults().length },
  ].filter(group => group.results.length));

  constructor() {
    afterNextRender(() => this.focusInput());
    this.requests.pipe(
      tap(query => {
        this.selectedIndex.set(-1);
        this.error.set(null);
        this.interpretation.set(null);
        this.primaryResults.set([]);
        this.relatedResults.set([]);
        this.isLoading.set(query.length >= SEARCH_INPUT_CONFIG.MIN_QUERY_LENGTH);
      }),
      switchMap(query => query.length < SEARCH_INPUT_CONFIG.MIN_QUERY_LENGTH
        ? EMPTY
        : timer(SEARCH_INPUT_CONFIG.DEBOUNCE_MS).pipe(
          switchMap(() => this.searchService.search(query, HYBRID_SEARCH_LIMITS.PREVIEW)),
          catchError(error => {
            this.logger.error('Hybrid search failed', error, 'ShopSearch');
            this.error.set(toAppError(error, {
              fallbackMessage: this.i18n.t('errors.searchFailedTryAgain'),
            }).message);
            return of(null);
          }),
        )),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(response => {
      this.interpretation.set(response?.interpretation ?? null);
      this.primaryResults.set(response?.results ?? []);
      this.relatedResults.set(response?.relatedResults ?? []);
      this.isLoading.set(false);
    });
  }

  focusInput(): void {
    this.searchInput()?.nativeElement.focus();
  }

  onSearchInput(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value.slice(0, SEARCH_INPUT_CONFIG.MAX_QUERY_LENGTH));
    this.requests.next(this.searchText());
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.close.emit();
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const total = this.results().length;
      if (!total) return;
      const current = this.selectedIndex();
      const next = current < 0
        ? (event.key === 'ArrowDown' ? 0 : total - 1)
        : (current + (event.key === 'ArrowDown' ? 1 : -1) + total) % total;
      this.selectedIndex.set(next);
      this.elementRef.nativeElement.querySelector(`#shop-search-option-${next}`)
        ?.scrollIntoView?.({ block: 'nearest' });
    } else if (event.key === 'Enter' && this.selectedIndex() >= 0) {
      event.preventDefault();
      this.selectResult(this.results()[this.selectedIndex()]);
    }
  }

  submitSearch(event?: Event): void {
    event?.preventDefault();
    if (!this.canSearch()) return;
    void this.router.navigate(['/products'], {
      queryParams: { search: this.searchText() },
    }).then(navigated => { if (navigated && !this.destroyRef.destroyed) this.close.emit(); });
  }

  selectResult(result: HybridSearchResult): void {
    void this.router.navigate(['/products', result.id])
      .then(navigated => { if (navigated && !this.destroyRef.destroyed) this.close.emit(); });
  }
}
