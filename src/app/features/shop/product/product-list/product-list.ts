import { Component, OnInit, computed, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { findProductDimension, formatDimensionCm } from '@core/models/product/product-dimension-filter';
import { SearchInterpretation } from '@features/shop/search-interpretation/search-interpretation';
import { PageHeader, FilterBar, ProductGrid, LoadMoreButton, CategoryFilter } from './components';
import { ProductCatalog } from './product-catalog';
import { composeProductSearchQuery, parseProductListFilters } from './product-list-filters';

@Component({
  selector: 'app-product-list',
  imports: [PageHeader, FilterBar, CategoryFilter, SearchInterpretation, ProductGrid, LoadMoreButton],
  templateUrl: './product-list.html',
  styleUrl: './product-list.css',
  providers: [ProductCatalog],
})
export class ProductList implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly catalog = inject(ProductCatalog);

  readonly pageTitle = computed(() => this.catalog.activeCategory()?.name ?? 'Muebles para tu espacio');
  readonly resultSummary = computed(() => {
    if (this.catalog.displayLoading() && !this.catalog.displayProducts().length) return 'Buscando productos…';
    const count = this.catalog.useSmartSearch() ? this.catalog.displayProducts().length : this.catalog.total();
    return `${count} ${count === 1 ? 'producto' : 'productos'}`;
  });
  readonly activeMeasurement = computed(() => {
    const filters = this.catalog.filters();
    const dimension = findProductDimension(filters.dimension);
    return dimension && filters.maxDimensionCm
      ? `${dimension.label} ≤ ${formatDimensionCm(filters.maxDimensionCm)} cm`
      : '';
  });

  ngOnInit(): void {
    this.catalog.connect(this.route.queryParamMap.pipe(map(parseProductListFilters)));
  }

  onClearSearch(): void {
    this.updateQueryParams({ search: null });
  }

  onRefineSearch(query: string): void {
    this.updateQueryParams({ search: query });
  }

  onSearchSubmit(fragment: string): void {
    const currentQuery = this.catalog.filters().search;
    const search = composeProductSearchQuery(currentQuery, fragment);
    if (!search || search === currentQuery) return;
    this.updateQueryParams({ search });
  }

  onClearCategory(): void {
    this.updateQueryParams({
      category: null,
      search: this.catalog.filters().search || null,
      dimension: null,
      maxDimensionCm: null,
    });
  }

  onClearMeasurement(): void {
    this.updateQueryParams({
      dimension: null,
      maxDimensionCm: null,
      search: this.catalog.filters().search || null,
    });
  }

  onSelectCategory(code: string): void {
    if (code === this.catalog.filters().categoryCode) return;
    this.updateQueryParams({ category: code || null, dimension: null, maxDimensionCm: null });
  }

  onMeasureRequested(): void {
    const filters = this.catalog.filters();
    this.router.navigate(['/products/measure'], {
      queryParams: {
        search: filters.search || null,
        category: filters.categoryCode || null,
        dimension: filters.dimension || null,
        maxDimensionCm: filters.maxDimensionCm,
      },
    });
  }

  private updateQueryParams(queryParams: Record<string, string | number | null>): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
    });
  }
}
