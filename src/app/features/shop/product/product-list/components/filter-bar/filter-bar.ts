import { Component, input, output, signal } from '@angular/core';
import { Category } from '@core/models/category/category';

export interface SortOption {
    value: string;
    label: string;
}

@Component({
    selector: 'app-filter-bar',
    imports: [],
    templateUrl: './filter-bar.html',
    styleUrl: './filter-bar.css',
})
export class FilterBar {
    categories = input<Category[]>([]);
    activeFilters = input<string[]>([]);
    selectedSort = input<string>('featured');
    viewMode = input<'grid' | 'list'>('grid');

    filterToggle = output<void>();
    removeFilter = output<string>();
    sortChange = output<string>();
    viewModeChange = output<'grid' | 'list'>();
    searchChange = output<string>();

    searchQuery = signal<string>('');
    private searchTimeout: ReturnType<typeof setTimeout> | null = null;

    sortOptions: SortOption[] = [
        { value: 'featured', label: 'Destacados' },
        { value: 'price_asc', label: 'Precio: Bajo a Alto' },
        { value: 'price_desc', label: 'Precio: Alto a Bajo' },
        { value: 'newest', label: 'Nuevos' },
    ];

    onSearchInput(event: Event): void {
        const input = event.target as HTMLInputElement;
        this.searchQuery.set(input.value);

        // Debounce: wait 400ms after user stops typing
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }
        this.searchTimeout = setTimeout(() => {
            this.searchChange.emit(input.value);
        }, 400);
    }

    onSearchSubmit(event: Event): void {
        event.preventDefault();
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }
        this.searchChange.emit(this.searchQuery());
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
}
