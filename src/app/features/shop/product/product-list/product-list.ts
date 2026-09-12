import { Component, inject, signal, computed, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { ProductStore } from '@core/services/product/product.store';
import { CategoryService } from '@core/services/category/category';
import { HybridSearchService, HYBRID_SEARCH_LIMITS } from '@core/services/search/hybrid-search';
import { LoggerService } from '@core/services/logger/logger';
import { Product } from '@core/models/product/product';
import { Category } from '@core/models/category/category';
import { HybridSearchResult } from '@core/models/search/hybrid-search.model';
import { MarketService } from '@core/services/market/market';
import { SEARCH_INPUT_CONFIG } from '@core/constants/search-input';
import {
  ProductDimension,
  findProductDimension,
  formatDimensionCm,
  parseMaxDimensionCm,
} from '@core/models/product/product-dimension-filter';
import { PageHeader, FilterBar, ProductGrid, LoadMoreButton } from './components';
import { EMPTY, Subject, catchError, combineLatest, distinctUntilChanged, finalize, map, of, startWith, switchMap, tap } from 'rxjs';

import { ActivatedRoute, Router } from '@angular/router';

type SearchProduct = Product & Pick<HybridSearchResult, 'score' | 'matchType'>;
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
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly store = inject(ProductStore);
  private readonly categoryService = inject(CategoryService);
  private readonly hybridSearchService = inject(HybridSearchService);
  private readonly marketService = inject(MarketService);
  private readonly hybridSearchRequests = new Subject<string>();
  private readonly refreshRequests = new Subject<void>();
  private readonly selectedMarketCode$ = toObservable(this.marketService.selectedMarket).pipe(
    map(market => market.code),
    distinctUntilChanged(),
  );

  isLoadingMore = computed(() =>
    !this.useSmartSearch() && this.store.isLoading() && this.store.products().length > 0
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

  pageTitle = computed(() => this.activeCategory() ? 'Categoría' : 'Colección');
  pageTitleBold = computed(() => this.activeCategory()?.name ?? 'Completa');
  pageDescription = computed(() => this.activeCategory()
    ? 'Explora los productos disponibles en esta categoría del catálogo de Muvia.'
    : 'Diseño contemporáneo para la vida moderna. Encuentra la pieza perfecta que define tu estilo único.'
  );
  activeMeasurement = computed(() => {
    const dimension = findProductDimension(this.selectedDimension());
    const maximum = this.maxDimensionCm();
    return dimension && maximum
      ? `${dimension.label} ≤ ${formatDimensionCm(maximum)} cm`
      : '';
  });

  hybridResults = signal<SearchProduct[]>([]);
  relatedProducts = signal<SearchProduct[]>([]);
  hybridLoading = signal<boolean>(false);
  hybridError = signal<string | null>(null);

  displayProducts = computed(() => this.isResolvingCategory() || this.categoryResolutionError()
    ? []
    : this.useSmartSearch() ? this.hybridResults() : this.store.products()
  );
  displayLoading = computed(() =>
    this.isResolvingCategory()
      || (this.useSmartSearch() ? this.hybridLoading() : this.store.isLoading())
  );
  displayError = computed(() => this.categoryResolutionError() ?? (this.useSmartSearch()
    ? this.hybridError()
    : this.store.isError() ? 'No pudimos cargar los productos. Inténtalo de nuevo.' : null)
  );

  constructor() {
    this.hybridSearchRequests.pipe(
      tap(query => {
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
          map(response => ({
            results: response.results.map(result => this.mapToProduct(result)),
            relatedResults: (response.relatedResults ?? []).map(result => this.mapToProduct(result)),
          })),
          catchError((error: HttpErrorResponse) => {
            this.logger.error('Hybrid search failed', error, 'ProductList');
            this.hybridError.set('No pudimos completar la búsqueda. Inténtalo de nuevo.');
            return of({ results: [] as SearchProduct[], relatedResults: [] as SearchProduct[] });
          })
        )
      ),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(response => {
      this.hybridResults.set(response.results);
      this.relatedProducts.set(response.relatedResults);
      this.hybridLoading.set(false);
    });
  }

  ngOnInit(): void {
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
        return this.categoryService.getCategories().pipe(
          map((categories): ResolvedProductListFilters => {
            const category = categories.find((item) => item.code === filters.categoryCode);
            if (!category) {
              throw new Error(`Selectable category ${filters.categoryCode} not found`);
            }

            return { ...filters, marketCode, categoryId: category.id, category };
          }),
          catchError((error: unknown) => {
            this.logger.error('Category resolution failed', error, 'ProductList');
            this.categoryResolutionError.set('No pudimos cargar esta categoría. Inténtalo de nuevo.');
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
    if (this.displayLoading()) return;

    if (this.categoryResolutionError()) {
      this.refreshRequests.next();
      return;
    }

    if (!this.useSmartSearch() && this.store.products().length > 0) {
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
    this.searchProducts(
      '',
      this.marketService.selectedMarket().code,
      this.categoryCode(),
      this.categoryId(),
      this.selectedDimension(),
      this.maxDimensionCm(),
    );

    // Clear URL query params
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { search: null },
      queryParamsHandling: 'merge'
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
}
