import {
  Component,
  ElementRef,
  computed,
  input,
  linkedSignal,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { SEARCH_INPUT_CONFIG } from '@core/constants/search-input';
import { HybridSearchInterpretation } from '@core/models/search/hybrid-search.model';

@Component({
  selector: 'app-search-interpretation',
  imports: [],
  templateUrl: './search-interpretation.html',
  styleUrl: './search-interpretation.css',
})
export class SearchInterpretation {
  readonly query = input.required<string>();
  readonly interpretation = input.required<HybridSearchInterpretation>();
  readonly editable = input(true);
  readonly compact = input(false);
  readonly refineSearch = output<string>();

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
