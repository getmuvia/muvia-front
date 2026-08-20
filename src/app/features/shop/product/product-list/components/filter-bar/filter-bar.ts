import { Component, input, output, linkedSignal, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Category } from '@core/models/category/category';
import { Subject, map, of, switchMap, timer } from 'rxjs';

export interface SortOption {
    value: string;
    label: string;
}

@Component({
    selector: 'app-filter-bar',
    imports: [],
    templateUrl: './filter-bar.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    styleUrl: './filter-bar.css',
})
export class FilterBar {
    readonly categories = input<Category[]>([]);
    readonly activeFilters = input<string[]>([]);
    readonly selectedSort = input<string>('featured');
    readonly viewMode = input<'grid' | 'list'>('grid');

    readonly filterToggle = output<void>();
    readonly removeFilter = output<string>();
    readonly sortChange = output<string>();
    readonly viewModeChange = output<'grid' | 'list'>();
    readonly searchChange = output<string>();
    /** Input for the current active search query to display as a chip */
    readonly activeSearch = input<string>('');
    /** Emitted when the user clears the search chip */
    readonly clearSearch = output<void>();

    readonly searchQuery = linkedSignal(() => this.activeSearch());
    private readonly searchRequests = new Subject<{ query: string; immediate: boolean }>();

    sortOptions: SortOption[] = [
        { value: 'featured', label: 'Destacados' },
        { value: 'price_asc', label: 'Precio: Bajo a Alto' },
        { value: 'price_desc', label: 'Precio: Alto a Bajo' },
        { value: 'newest', label: 'Nuevos' },
    ];

    constructor() {
        this.searchRequests.pipe(
            switchMap(({ query, immediate }) => immediate
                ? of(query)
                : timer(700).pipe(map(() => query))
            ),
            takeUntilDestroyed()
        ).subscribe(query => this.searchChange.emit(query));
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

    onSortChange(event: Event): void {
        const select = event.target as HTMLSelectElement;
        this.sortChange.emit(select.value);
    }

    onRemoveFilter(filter: string): void {
        this.removeFilter.emit(filter);
    }

    onToggleViewMode(mode: 'grid' | 'list'): void {
        this.viewModeChange.emit(mode);
    }

    onFilterToggle(): void {
        this.filterToggle.emit();
    }

    onClearSearch(): void {
        this.searchQuery.set('');
        this.clearSearch.emit();
    }
}
