import { TranslatePipe } from '@core/services/i18n/translation-pipes';
import {
  Component,
  ElementRef,
  computed,
  inject,
  input,
  linkedSignal,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { SEARCH_INPUT_CONFIG } from '@core/constants/search-input';
import { HybridSearchInterpretation } from '@core/models/search/hybrid-search.model';
import { I18nService } from '@core/services/i18n/i18n';
import { MarketService } from '@core/services/market/market';
import { formatDimensionCm } from '@core/models/product/product-dimension-filter';

@Component({
  selector: 'app-search-interpretation',
  imports: [TranslatePipe],
  templateUrl: './search-interpretation.html',
  styleUrl: './search-interpretation.css',
})
export class SearchInterpretation {
  private readonly i18n = inject(I18nService);
  private readonly market = inject(MarketService);
  readonly query = input.required<string>();
  readonly interpretation = input.required<HybridSearchInterpretation>();
  readonly editable = input(true);
  readonly compact = input(false);
  readonly refineSearch = output<string>();
  readonly summary = computed(() => {
    const intent = this.interpretation();
    const parts = [
      intent.category ? this.i18n.label(`search.category.${intent.category.code}`, intent.category.label) : '',
      intent.material ? this.i18n.text(intent.material.label) : '',
      intent.measurement ? this.i18n.t('search.measurement', {
        value: formatDimensionCm(intent.measurement.maxDimensionCm, this.market.locale()),
        dimension: this.i18n.t(`search.${intent.measurement.dimension}`),
      }) : '',
    ].filter(Boolean);
    return parts.length ? parts.join(' · ') : intent.summary;
  });

  private readonly queryInput = viewChild<ElementRef<HTMLInputElement>>('queryInput');

  protected readonly maxQueryLength = SEARCH_INPUT_CONFIG.MAX_QUERY_LENGTH;
  protected readonly isEditing = signal(false);
  protected readonly draftQuery = linkedSignal(() => this.query());
  protected readonly normalizedDraft = computed(() => this.normalizeQuery(this.draftQuery()));
  protected readonly canSubmit = computed(() => {
    const draft = this.normalizedDraft();
    return draft.length >= SEARCH_INPUT_CONFIG.MIN_QUERY_LENGTH
      && draft.length <= this.maxQueryLength
      && draft !== this.normalizeQuery(this.query());
  });

  protected startEditing(): void {
    if (!this.editable()) return;

    this.draftQuery.set(this.query());
    this.isEditing.set(true);
    queueMicrotask(() => {
      const inputElement = this.queryInput()?.nativeElement;
      inputElement?.focus();
      inputElement?.select();
    });
  }

  protected cancelEditing(): void {
    this.draftQuery.set(this.query());
    this.isEditing.set(false);
  }

  protected onQueryInput(event: Event): void {
    this.draftQuery.set((event.target as HTMLInputElement).value);
  }

  protected submitRefinement(event: Event): void {
    event.preventDefault();
    if (!this.canSubmit()) return;

    this.refineSearch.emit(this.normalizedDraft());
    this.isEditing.set(false);
  }

  private normalizeQuery(query: string): string {
    return query.trim().replace(/\s+/g, ' ');
  }
}
