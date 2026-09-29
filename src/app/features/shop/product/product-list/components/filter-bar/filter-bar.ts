import { Component, computed, input, output, signal } from '@angular/core';
import { SEARCH_INPUT_CONFIG } from '@core/constants/search-input';

@Component({
    selector: 'app-filter-bar',
    imports: [],
    templateUrl: './filter-bar.html',
    styleUrl: './filter-bar.css',
})
export class FilterBar {
    /** Emits only when the buyer explicitly submits a new search fragment. */
    readonly searchSubmit = output<string>();
    /** Input for the current active search query to display as a chip */
    readonly activeSearch = input<string>('');
    /** Emitted when the user clears the search chip */
    readonly clearSearch = output<void>();
    /** Name of the category currently filtering the catalog */
    readonly activeCategory = input<string>('');
    /** Emitted when the user removes the category filter */
    readonly clearCategory = output<void>();
    /** Human-readable active dimension limit */
    readonly activeMeasurement = input<string>('');
    /** Emitted when the user removes the dimension limit */
    readonly clearMeasurement = output<void>();
    /** Opens the structured dimension filter */
    readonly measureRequested = output<void>();

    readonly searchQuery = signal('');
    readonly searchPlaceholder = computed(() => this.activeSearch()
        ? 'Añade otro detalle...'
        : 'Describe lo que buscas...'
    );

    onSearchInput(event: Event): void {
        const input = event.target as HTMLInputElement;
        this.searchQuery.set(input.value);
    }

    onSearchSubmit(event: Event): void {
        event.preventDefault();
        const query = this.searchQuery().trim().replace(/\s+/g, ' ');
        if (query.length < SEARCH_INPUT_CONFIG.MIN_QUERY_LENGTH) return;

        this.searchSubmit.emit(query);
        this.searchQuery.set('');
    }

    onClearSearch(): void {
        this.searchQuery.set('');
        this.clearSearch.emit();
    }

    onClearCategory(): void {
        this.clearCategory.emit();
    }

    onClearMeasurement(): void {
        this.clearMeasurement.emit();
    }
}
