import {
  Component,
  inject,
  signal,
  computed,
  output,
  afterNextRender,
  ElementRef,
  viewChild,
  HostListener,
  DestroyRef,
  ChangeDetectionStrategy
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { NgOptimizedImage, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { HybridSearchService, HYBRID_SEARCH_LIMITS } from '@core/services/search/hybrid-search';
import { LoggerService } from '@core/services/logger/logger';
import { HybridSearchResult } from '@core/models/search/hybrid-search.model';
import { EMPTY, Subject, catchError, map, of, switchMap, tap, timer } from 'rxjs';

@Component({
    selector: 'app-smart-search-modal',
    imports: [NgOptimizedImage, DecimalPipe],
    templateUrl: './smart-search-modal.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    styleUrl: './smart-search-modal.css',
})
export class SmartSearchModal {
    private readonly destroyRef = inject(DestroyRef);
    private readonly router = inject(Router);
    private readonly searchService = inject(HybridSearchService);
    private readonly logger = inject(LoggerService);
    private readonly searchRequests = new Subject<string>();

    readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');

    /** Event emitted when modal should close */
    readonly close = output<void>();

    /** Search state */
    query = signal('');
    results = signal<HybridSearchResult[]>([]);
    isLoading = signal(false);
    error = signal<string | null>(null);

    /** Keyboard navigation */
    selectedIndex = signal(-1);

    /** Computed states */
    hasResults = computed(() => this.results().length > 0);
    showEmptyState = computed(() =>
        this.query().length >= 2 && !this.isLoading() && !this.hasResults() && !this.error()
    );

    constructor() {
        afterNextRender(() => this.searchInput()?.nativeElement.focus());

        this.searchRequests.pipe(
            tap(query => {
                this.selectedIndex.set(-1);
                this.error.set(null);

                if (query.length < 2) {
                    this.results.set([]);
                    this.isLoading.set(false);
                }
            }),
            switchMap(query => query.length < 2
                ? EMPTY
                : timer(600).pipe(
                    tap(() => this.isLoading.set(true)),
                    switchMap(() => this.searchService.search(query, HYBRID_SEARCH_LIMITS.MODAL)),
                    map(response => response.results),
                    catchError((error: HttpErrorResponse) => {
                        this.logger.error('Hybrid search failed', error, 'SmartSearchModal');
                        this.error.set('Error al buscar. Intenta de nuevo.');
                        return of([] as HybridSearchResult[]);
                    })
                )
            ),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe(results => {
            this.results.set(results);
            this.isLoading.set(false);
        });
    }

    /**
     * Handles keydown events for keyboard navigation (Arrows) and selection (Enter).
     * @param event Keyboard event
     */
    @HostListener('document:keydown', ['$event'])
    handleKeyboard(event: KeyboardEvent): void {
        switch (event.key) {
            case 'Escape':
                this.onClose();
                break;
            case 'ArrowDown':
                event.preventDefault();
                this.navigateResults(1);
                break;
            case 'ArrowUp':
                event.preventDefault();
                this.navigateResults(-1);
                break;
            case 'Enter':
                if (this.selectedIndex() >= 0) {
                    this.selectResult(this.results()[this.selectedIndex()]);
                } else if (this.query().length >= 2) {
                    this.submitSearch();
                }
                break;
        }
    }

    /**
     * Handles input changes with a 600ms debounce to avoid excessive API calls.
     * Triggers the hybrid search if query length >= 2 chars.
     * @param event Input event
     */
    onSearchInput(event: Event): void {
        const input = event.target as HTMLInputElement;
        const value = input.value.trim();
        this.query.set(value);
        this.searchRequests.next(value);
    }

    private navigateResults(direction: number): void {
        const total = this.results().length;
        if (total === 0) return;

        let newIndex = this.selectedIndex() + direction;
        if (newIndex < 0) newIndex = total - 1;
        if (newIndex >= total) newIndex = 0;

        this.selectedIndex.set(newIndex);
    }

    /**
     * Navigates to the full product list with the current query.
     * Closes the modal AFTER navigation starts to prevent race conditions.
     */
    submitSearch(): void {
        this.router.navigate(['/products'], {
            queryParams: { search: this.query() }
        }).then(() => this.onClose());
    }

    /**
     * Navigates to a specific product detail page.
     * @param result Selected hybrid search result
     */
    selectResult(result: HybridSearchResult): void {
        this.router.navigate(['/products', result.id]).then(() => this.onClose());
    }

    onBackdropClick(event: MouseEvent): void {
        if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
            this.onClose();
        }
    }

    onClose(): void {
        this.close.emit();
    }
}
