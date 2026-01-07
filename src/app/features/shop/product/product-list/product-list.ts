import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { ProductService, PaginatedResponse } from '@core/services/product/product';
import { CategoryService } from '@core/services/category/category';
import { Product } from '@core/models/product/product';
import { Category } from '@core/models/category/category';
import { PageHeader, FilterBar, ProductGrid, LoadMoreButton } from './components';

@Component({
  selector: 'app-product-list',
  imports: [PageHeader, FilterBar, ProductGrid, LoadMoreButton],
  templateUrl: './product-list.html',
  styleUrl: './product-list.css',
})
export class ProductList implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly categoryService = inject(CategoryService);

  // Products state
  products = signal<Product[]>([]);
  isLoading = signal<boolean>(false);
  isLoadingMore = signal<boolean>(false);

  // Pagination state
  currentPage = signal<number>(1);
  totalProducts = signal<number>(0);
  pageLimit = 12;

  // Computed
  hasMore = computed(() => this.products().length < this.totalProducts());

  // Search state
  searchQuery = signal<string>('');

  // Filter state
  categories = signal<Category[]>([]);
  activeFilters = signal<string[]>([]);
  selectedSort = signal<string>('featured');
  viewMode = signal<'grid' | 'list'>('grid');

  ngOnInit(): void {
    this.loadProducts();
    this.loadCategories();
  }

  loadProducts(): void {
    this.isLoading.set(true);
    this.productService.getAllProducts({ page: 1, limit: this.pageLimit }).subscribe({
      next: (response) => {
        this.products.set(response.data);
        this.totalProducts.set(response.total);
        this.currentPage.set(response.page);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading products:', err);
        this.isLoading.set(false);
      }
    });
  }

  loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (categories) => {
        this.categories.set(categories);
      },
      error: (err) => {
        console.error('Error loading categories:', err);
      }
    });
  }

  loadMore(): void {
    if (this.isLoadingMore() || !this.hasMore()) return;

    this.isLoadingMore.set(true);
    const nextPage = this.currentPage() + 1;

    const request = this.searchQuery()
      ? this.productService.searchProducts({ search: this.searchQuery(), page: nextPage, limit: this.pageLimit })
      : this.productService.getAllProducts({ page: nextPage, limit: this.pageLimit });

    request.subscribe({
      next: (response) => {
        this.products.update(current => [...current, ...response.data]);
        this.currentPage.set(response.page);
        this.isLoadingMore.set(false);
      },
      error: (err) => {
        console.error('Error loading more products:', err);
        this.isLoadingMore.set(false);
      }
    });
  }

  searchProducts(query: string): void {
    this.searchQuery.set(query);
    this.isLoading.set(true);

    if (!query.trim()) {
      this.loadProducts();
      return;
    }

    this.productService.searchProducts({ search: query, page: 1, limit: this.pageLimit }).subscribe({
      next: (response) => {
        this.products.set(response.data);
        this.totalProducts.set(response.total);
        this.currentPage.set(response.page);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error searching products:', err);
        this.isLoading.set(false);
      }
    });
  }

  onFilterToggle(): void {
    // TODO: Implement filter panel toggle
    console.log('Filter toggle clicked');
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
