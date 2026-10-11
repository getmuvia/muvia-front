import { TranslatePipe, UiTextPipe } from '@core/services/i18n/translation-pipes';
import { Component, OnInit, computed, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { findProductDimension, formatDimensionCm } from '@core/models/product/product-dimension-filter';
import { ProductCondition } from '@core/models/product/product-condition';
import { SearchInterpretation } from '@features/shop/search-interpretation/search-interpretation';
import { PageHeader, FilterBar, ProductGrid, LoadMoreButton, CategoryFilter } from './components';
import { ProductCatalog } from './product-catalog';
import { composeProductSearchQuery, parseProductListFilters } from './product-list-filters';
import { I18nService } from '@core/services/i18n/i18n';
import { MarketService } from '@core/services/market/market';

@Component({
  selector: 'app-product-list',
  imports: [TranslatePipe, UiTextPipe, PageHeader, FilterBar, CategoryFilter, SearchInterpretation, ProductGrid, LoadMoreButton],
  templateUrl: './product-list.html',
  styleUrl: './product-list.css',
  providers: [ProductCatalog],
})
export class ProductList implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly catalog = inject(ProductCatalog);
  private readonly i18n = inject(I18nService);
  private readonly market = inject(MarketService);

  readonly activeCategoryName = computed(() => this.catalog.activeCategory()
    ? this.i18n.categoryName(this.catalog.activeCategory()) : '');
  readonly pageTitle = computed(() => this.activeCategoryName() || this.i18n.text('Muebles para tu espacio'));
  readonly resultSummary = computed(() => {
    if (this.catalog.displayLoading() && !this.catalog.displayProducts().length) return this.i18n.text('Buscando productos…');
    const count = this.catalog.useSmartSearch() ? this.catalog.displayProducts().length : this.catalog.total();
    return this.i18n.t(count === 1 ? 'catalog.productCount.one' : 'catalog.productCount.other', {count});
  });
  readonly activeMeasurement = computed(() => {
    const filters = this.catalog.filters();
    const dimension = findProductDimension(filters.dimension);
    return dimension && filters.maxDimensionCm
      ? `${this.i18n.text(dimension.label)} ≤ ${formatDimensionCm(filters.maxDimensionCm, this.market.locale())} cm`
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

  onSelectCondition(condition: ProductCondition | ''): void {
    if (condition === (this.catalog.filters().condition ?? '')) return;
    this.updateQueryParams({ condition: condition || null });
  }

  onMeasureRequested(): void {
    const filters = this.catalog.filters();
    this.router.navigate(['/products/measure'], {
      queryParams: {
        search: filters.search || null,
        category: filters.categoryCode || null,
        condition: filters.condition ?? null,
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
