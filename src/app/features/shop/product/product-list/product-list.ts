import { Component, inject, signal, computed, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { ProductStore } from '@core/services/product/product.store';
import { PaginatedResponse } from '@core/services/product/product';
import { CategoryService } from '@core/services/category/category';
import { LoggerService } from '@core/services/logger/logger';
import { Product } from '@core/models/product/product';
import { Category } from '@core/models/category/category';
import { PageHeader, FilterBar, ProductGrid, LoadMoreButton } from './components';

@Component({
  selector: 'app-product-list',
  imports: [PageHeader, FilterBar, ProductGrid, LoadMoreButton],
  templateUrl: './product-list.html',
  styleUrl: './product-list.css',
  providers: [ProductStore]
})
export class ProductList implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly logger = inject(LoggerService);
  readonly store = inject(ProductStore);
  private readonly categoryService = inject(CategoryService);

  // Derived UI state
  isLoadingMore = computed(() => this.store.isLoading() && this.store.products().length > 0);

  // Search state
  searchQuery = signal<string>('');

  // Local Filter UI state (could be moved to Store if needed)
  categories = signal<Category[]>([]);
  activeFilters = signal<string[]>([]);
  selectedSort = signal<string>('featured');
  viewMode = signal<'grid' | 'list'>('grid');

  ngOnInit(): void {
    // Initial load
    this.store.searchProducts({ page: 1, search: '' });
    this.loadCategories();
  }

  loadCategories(): void {
    this.categoryService.getCategories().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (categories) => {
        this.categories.set(categories);
      },
      error: (error: HttpErrorResponse) => {
        this.logger.error('Failed to load categories', error, 'ProductList');
      }
    });
  }

  loadMore(): void {
    if (this.store.isLoading() || !this.store.hasNextPage()) return; // Prevent spam

    this.store.searchProducts({
      page: this.store.page() + 1,
      search: this.searchQuery()
    });
  }

  searchProducts(query: string): void {
    this.searchQuery.set(query);
    // Reset to page 1 for new search
    this.store.searchProducts({
      page: 1,
      search: query
    });
  }

  onFilterToggle(): void {
    // TODO: Implement filter panel toggle
  }

  onRemoveFilter(filter: string): void {
    this.activeFilters.update(filters => filters.filter(f => f !== filter));
    // TODO: Reload products with updated filters
  }

  onSortChange(sort: string): void {
    this.selectedSort.set(sort);
    // TODO: Reload products with new sort
  }

  onViewModeChange(mode: 'grid' | 'list'): void {
    this.viewMode.set(mode);
  }
}
