import { Component, inject, signal, computed, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { ProductStore } from '@core/services/product/product.store';
import { CategoryService } from '@core/services/category/category';
import { HybridSearchService, HYBRID_SEARCH_LIMITS } from '@core/services/search/hybrid-search';
import { LoggerService } from '@core/services/logger/logger';
import { Product } from '@core/models/product/product';
import { Category } from '@core/models/category/category';
import {
  HybridSearchInterpretation,
  HybridSearchResult,
} from '@core/models/search/hybrid-search.model';
import { MarketService } from '@core/services/market/market';
import { SEARCH_INPUT_CONFIG } from '@core/constants/search-input';
import { SearchInterpretation } from '@features/shop/search-interpretation/search-interpretation';
import {
  ProductDimension,
  findProductDimension,
  formatDimensionCm,
  parseMaxDimensionCm,
} from '@core/models/product/product-dimension-filter';
import { PageHeader, FilterBar, ProductGrid, LoadMoreButton, CategoryFilter } from './components';
import { EMPTY, Subject, catchError, combineLatest, distinctUntilChanged, filter, finalize, map, of, shareReplay, startWith, switchMap, take, tap } from 'rxjs';

import { ActivatedRoute, Router } from '@angular/router';

type SearchProduct = Product & Pick<HybridSearchResult, 'score' | 'matchType'>;
type HybridProductListResponse = {
  interpretation: HybridSearchInterpretation | null;
  results: SearchProduct[];
  relatedResults: SearchProduct[];
};
type ProductListFilters = {
  search: string;
  categoryCode: string;
  dimension: ProductDimension | '';
  maxDimensionCm: number | null;
};
type ResolvedProductListFilters = ProductListFilters & {
  marketCode: string;
  categoryId: string;
  category: Category | null;
};
type CategoryOptionsState = {
  marketCode: string;
  categories: Category[];
  isLoading: boolean;
  error: string | null;
};

@Component({
  selector: 'app-product-list',
  imports: [PageHeader, FilterBar, CategoryFilter, SearchInterpretation, ProductGrid, LoadMoreButton],
  templateUrl: './product-list.html',
  styleUrl: './product-list.css',
  providers: [ProductStore]
})
export class ProductList implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly logger = inject(LoggerService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly store = inject(ProductStore);
  private readonly categoryService = inject(CategoryService);
  private readonly hybridSearchService = inject(HybridSearchService);
  private readonly marketService = inject(MarketService);
  private readonly hybridSearchRequests = new Subject<string>();
  private readonly refreshRequests = new Subject<void>();
  private readonly categoryRefreshRequests = new Subject<void>();
  private readonly selectedMarketCode$ = toObservable(this.marketService.selectedMarket).pipe(
    map(market => market.code),
    distinctUntilChanged(),
  );

  isLoadingMore = computed(() =>
    !this.useSmartSearch() && this.store.isLoading() && this.store.catalogProducts().length > 0
  );

  searchQuery = signal<string>('');
  categoryCode = signal<string>('');
  categoryId = signal<string>('');
  selectedDimension = signal<ProductDimension | ''>('');
  maxDimensionCm = signal<number | null>(null);
  activeCategory = signal<Category | null>(null);
  isResolvingCategory = signal<boolean>(false);
  categoryResolutionError = signal<string | null>(null);
  useSmartSearch = signal<boolean>(false);

  readonly categories = signal<Category[]>([]);
  readonly isLoadingCategories = signal(true);
  readonly categoryListError = signal<string | null>(null);
  private readonly categoryOptions$ = combineLatest([
    this.selectedMarketCode$,
    this.categoryRefreshRequests.pipe(startWith(undefined)),
  ]).pipe(
    switchMap(([marketCode]) => {
      const locale = this.marketService.locale();
      const loading: CategoryOptionsState = { marketCode, categories: [], isLoading: true, error: null };
      return this.categoryService.getCategories().pipe(
        map((categories): CategoryOptionsState => ({
          marketCode,
          categories: [...categories].sort((a, b) => a.name.localeCompare(b.name, locale, { sensitivity: 'base' })),
          isLoading: false,
          error: null,
        })),
        catchError((error: unknown) => {
          this.logger.error('Catalog categories failed to load', error, 'ProductList');
          return of<CategoryOptionsState>({
            ...loading,
            isLoading: false,
            error: 'No pudimos cargar las categorías. Inténtalo de nuevo.',
          });
        }),
        startWith(loading),
      );
    }),
    shareReplay({ bufferSize: 1, refCount: true }),
  );
  pageTitle = computed(() => this.activeCategory()?.name ?? 'Muebles para tu espacio');
  readonly resultSummary = computed(() => {
    if (this.displayLoading() && !this.displayProducts().length) return 'Buscando productos…';
    const count = this.useSmartSearch() ? this.displayProducts().length : this.store.total();
    return `${count} ${count === 1 ? 'producto' : 'productos'}`;
  });
  activeMeasurement = computed(() => {
    const dimension = findProductDimension(this.selectedDimension());
    const maximum = this.maxDimensionCm();
    return dimension && maximum
      ? `${dimension.label} ≤ ${formatDimensionCm(maximum)} cm`
      : '';
  });

  hybridResults = signal<SearchProduct[]>([]);
  relatedProducts = signal<SearchProduct[]>([]);
  interpretation = signal<HybridSearchInterpretation | null>(null);
  hybridLoading = signal<boolean>(false);
  hybridError = signal<string | null>(null);

  displayProducts = computed(() => this.isResolvingCategory() || this.categoryResolutionError()
    ? []
    : this.useSmartSearch() ? this.hybridResults() : this.store.catalogProducts()
  );
  displayLoading = computed(() =>
    this.isResolvingCategory()
      || (this.useSmartSearch() ? this.hybridLoading() : this.store.isLoading())
  );
  displayError = computed(() => {
    if (this.categoryResolutionError()) return this.categoryResolutionError();
    if (this.useSmartSearch()) return this.hybridError();
    if (!this.store.isError()) return null;

    return this.store.error()?.message ?? 'No pudimos cargar los productos. Inténtalo de nuevo.';
  });
  canRetryDisplayError = computed(() => {
    if (this.categoryResolutionError() || (this.useSmartSearch() && this.hybridError())) {
      return true;
    }

    return this.store.error()?.retryable ?? false;
  });

  constructor() {
    this.hybridSearchRequests.pipe(
      tap(query => {
        this.interpretation.set(null);
        this.relatedProducts.set([]);
        if (query.length < SEARCH_INPUT_CONFIG.MIN_QUERY_LENGTH) {
          this.hybridLoading.set(false);
          this.hybridError.set(null);
          this.hybridResults.set([]);
          return;
        }

        this.hybridLoading.set(true);
        this.hybridError.set(null);
        this.hybridResults.set([]);
      }),
      switchMap(query => query.length < SEARCH_INPUT_CONFIG.MIN_QUERY_LENGTH
        ? EMPTY
        : this.hybridSearchService.search(query, HYBRID_SEARCH_LIMITS.PRODUCT_LIST).pipe(
          map((response): HybridProductListResponse => ({
            interpretation: response.interpretation,
            results: response.results.map(result => this.mapToProduct(result)),
            relatedResults: (response.relatedResults ?? []).map(result => this.mapToProduct(result)),
          })),
          catchError((error: HttpErrorResponse) => {
            this.logger.error('Hybrid search failed', error, 'ProductList');
            this.hybridError.set('No pudimos completar la búsqueda. Inténtalo de nuevo.');
            return of<HybridProductListResponse>({
              interpretation: null,
              results: [],
              relatedResults: [],
            });
          })
        )
      ),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(response => {
      this.interpretation.set(response.interpretation);
      this.hybridResults.set(response.results);
      this.relatedProducts.set(response.relatedResults);
      this.hybridLoading.set(false);
    });
  }

  ngOnInit(): void {
    this.categoryOptions$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((state) => {
      this.categories.set(state.categories);
      this.isLoadingCategories.set(state.isLoading);
      this.categoryListError.set(state.error);
    });

    combineLatest([
      this.route.queryParamMap.pipe(
        map((params): ProductListFilters => {
          const dimension = findProductDimension(params.get('dimension'));
          const maxDimensionCm = parseMaxDimensionCm(params.get('maxDimensionCm'));
          return {
            search: (params.get('search') ?? '').trim(),
            categoryCode: params.get('category')?.trim().toUpperCase() ?? '',
            dimension: dimension && maxDimensionCm ? dimension.value : '',
            maxDimensionCm: dimension && maxDimensionCm ? maxDimensionCm : null,
          };
        }),
        distinctUntilChanged((previous, current) =>
          previous.search === current.search
          && previous.categoryCode === current.categoryCode
          && previous.dimension === current.dimension
          && previous.maxDimensionCm === current.maxDimensionCm
        ),
      ),
      this.selectedMarketCode$,
      this.refreshRequests.pipe(startWith(undefined)),
    ]).pipe(
      switchMap(([filters, marketCode]) => {
        this.categoryCode.set(filters.categoryCode);
        this.categoryId.set('');
        this.selectedDimension.set(filters.dimension);
        this.maxDimensionCm.set(filters.maxDimensionCm);
        this.activeCategory.set(null);
        this.categoryResolutionError.set(null);

        if (!filters.categoryCode) {
          this.isResolvingCategory.set(false);
          return of<ResolvedProductListFilters>({
            ...filters,
            dimension: '',
            maxDimensionCm: null,
            marketCode,
            categoryId: '',
            category: null,
          });
        }

        this.isResolvingCategory.set(true);
        return this.categoryOptions$.pipe(
          filter((state) => state.marketCode === marketCode && !state.isLoading),
          take(1),
          map((state): ResolvedProductListFilters => {
            const category = state.categories.find((item) => item.code === filters.categoryCode);
            if (!category) {
              throw new Error(`Selectable category ${filters.categoryCode} not found`);
            }

            return { ...filters, marketCode, categoryId: category.id, category };
          }),
          catchError((error: unknown) => {
            if (!this.categoryListError()) {
              this.logger.error('Category resolution failed', error, 'ProductList');
            }
            this.categoryResolutionError.set(this.categoryListError() ?? 'No pudimos cargar esta categoría. Inténtalo de nuevo.');
            return EMPTY;
          }),
          finalize(() => this.isResolvingCategory.set(false)),
        );
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((filters) => {
      this.activeCategory.set(filters.category);
      this.searchProducts(
        filters.search,
        filters.marketCode,
        filters.categoryCode,
        filters.categoryId,
        filters.dimension,
        filters.maxDimensionCm,
      );
    });
  }

  loadMore(): void {
    if (this.useSmartSearch()) return;
    if (this.store.isLoading() || !this.store.hasNextPage()) return;

    this.store.searchProducts({
      page: this.store.page() + 1,
      search: this.searchQuery(),
      marketCode: this.marketService.selectedMarket().code,
      categoryId: this.categoryId() || undefined,
      dimension: this.selectedDimension() || undefined,
      maxDimensionCm: this.maxDimensionCm() ?? undefined,
    });
  }

  /**
   * Initiates product search.
   * Switches between "Smart Search" (Hybrid) and normal SQL search based on query length.
   * 
   * @param query Search term from URL or input
   */
  searchProducts(
    query: string,
    marketCode = this.marketService.selectedMarket().code,
    categoryCode = this.categoryCode(),
    categoryId = this.categoryId(),
    dimension: ProductDimension | '' = this.selectedDimension(),
    maxDimensionCm: number | null = this.maxDimensionCm(),
  ): void {
    query = query.trim();
    const effectiveQuery = query.length >= SEARCH_INPUT_CONFIG.MIN_QUERY_LENGTH ? query : '';
    this.searchQuery.set(effectiveQuery);
    this.categoryCode.set(categoryCode);
    this.categoryId.set(categoryId);
    this.selectedDimension.set(dimension);
    this.maxDimensionCm.set(maxDimensionCm);

    if (categoryCode && !categoryId) {
      this.categoryResolutionError.set('No pudimos cargar esta categoría. Inténtalo de nuevo.');
      return;
    }

    this.categoryResolutionError.set(null);

    const hasStructuredFilters = Boolean(categoryCode || (dimension && maxDimensionCm));
    if (effectiveQuery && !hasStructuredFilters) {
      this.useSmartSearch.set(true);
      this.performHybridSearch(effectiveQuery);
    } else {
      this.hybridSearchRequests.next('');
      this.useSmartSearch.set(false);
      this.store.searchProducts({
        page: 1,
        search: effectiveQuery,
        marketCode,
        categoryId: categoryId || undefined,
        dimension: dimension || undefined,
        maxDimensionCm: maxDimensionCm ?? undefined,
      });
    }
  }

  retryProducts(): void {
    if (this.displayLoading() || !this.canRetryDisplayError()) return;

    if (this.categoryResolutionError()) {
      if (this.categoryListError()) this.retryCategories();
      else this.refreshRequests.next();
      return;
    }

    if (!this.useSmartSearch() && this.store.catalogProducts().length > 0) {
      this.loadMore();
      return;
    }

    this.searchProducts(
      this.searchQuery(),
      this.marketService.selectedMarket().code,
      this.categoryCode(),
      this.categoryId(),
      this.selectedDimension(),
      this.maxDimensionCm(),
    );
  }

  /**
   * Executes AI-powered hybrid search.
   * @param query Search term (must be >= 2 chars)
   */
  private performHybridSearch(query: string): void {
    this.hybridSearchRequests.next(query);
  }

  /** Map HybridSearchResult to Product format for display */
  private mapToProduct(result: HybridSearchResult): SearchProduct {
    return {
      id: result.id,
      sellerId: '',
      categoryId: '',
      title: result.title,
      description: result.description ?? '',
      score: result.score,
      matchType: result.matchType,
      price: result.price.toString(),
      stock: 0,
      specifications: {},
      keywords: [],
      createdAt: '',
      assets: result.imageUrl ? [{
        id: '',
        productId: result.id,
        url: result.imageUrl,
        type: 'image',
        isPrimary: true,
        metadata: {}
      }] : [],
      category: {
        id: '',
        parentId: null,
        name: '',
        description: '',
        imageUrl: '',
        level: 0
      }
    };
  }

  onClearSearch(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { search: null },
      queryParamsHandling: 'merge'
    });
  }

  onRefineSearch(query: string): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { search: query },
      queryParamsHandling: 'merge',
    });
  }

  onSearchSubmit(fragment: string): void {
    const search = this.composeSearchQuery(this.searchQuery(), fragment);
    if (!search || search === this.searchQuery()) return;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { search },
      queryParamsHandling: 'merge',
    });
  }

  onClearCategory(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        category: null,
        search: this.searchQuery() || null,
        dimension: null,
        maxDimensionCm: null,
      },
      queryParamsHandling: 'merge',
    });
  }

  onClearMeasurement(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        dimension: null,
        maxDimensionCm: null,
        search: this.searchQuery() || null,
      },
      queryParamsHandling: 'merge',
    });
  }

  onSelectCategory(code: string): void {
    if (code === this.categoryCode()) return;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        category: code || null,
        dimension: null,
        maxDimensionCm: null,
      },
      queryParamsHandling: 'merge',
    });
  }

  retryCategories(): void {
    if (this.isLoadingCategories()) return;

    const needsCategoryResolution = !!this.categoryResolutionError();
    this.categoryRefreshRequests.next();
    if (needsCategoryResolution) this.refreshRequests.next();
  }

  onMeasureRequested(): void {
    this.router.navigate(['/products/measure'], {
      queryParams: {
        search: this.searchQuery() || null,
        category: this.categoryCode() || null,
        dimension: this.selectedDimension() || null,
        maxDimensionCm: this.maxDimensionCm(),
      },
    });
  }

  private composeSearchQuery(currentQuery: string, fragment: string): string {
    const current = currentQuery.trim().replace(/[\s,;:.]+$/g, '');
    const addition = fragment.trim().replace(/^[\s,;:.]+/g, '');

    if (!current) return addition;
    if (!addition) return current;
    return `${current}, ${addition}`;
  }
}
