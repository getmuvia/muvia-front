import { Component, input, output, linkedSignal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, Subject, map, of, switchMap, timer } from 'rxjs';
import { SEARCH_INPUT_CONFIG } from '@core/constants/search-input';

@Component({
    selector: 'app-filter-bar',
    imports: [],
    templateUrl: './filter-bar.html',
    styleUrl: './filter-bar.css',
})
export class FilterBar {
    readonly searchChange = output<string>();
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
    /** Opens the guided measurement flow */
    readonly measureRequested = output<void>();

    readonly searchQuery = linkedSignal(() => this.activeSearch());
    private readonly searchRequests = new Subject<{ query: string; immediate: boolean } | null>();

    constructor() {
        this.searchRequests.pipe(
            switchMap(request => request === null
                ? EMPTY
                : request.immediate
                    ? of(request.query)
                    : timer(SEARCH_INPUT_CONFIG.DEBOUNCE_MS).pipe(map(() => request.query))
            ),
            takeUntilDestroyed()
        ).subscribe(query => {
            const normalizedQuery = query.trim();
            const effectiveQuery = normalizedQuery.length >= SEARCH_INPUT_CONFIG.MIN_QUERY_LENGTH
                ? normalizedQuery
                : '';
            if (effectiveQuery !== this.activeSearch()) {
                this.searchChange.emit(effectiveQuery);
            }
        });
    }

    onSearchInput(event: Event): void {
        const input = event.target as HTMLInputElement;
        this.searchQuery.set(input.value);

        this.searchRequests.next({ query: input.value, immediate: false });
    }

    onSearchSubmit(event: Event): void {
        event.preventDefault();
        this.searchRequests.next({ query: this.searchQuery(), immediate: true });
    }

    onClearSearch(): void {
        this.searchRequests.next(null);
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
