import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import {
  EMPTY, Observable, Subject, catchError, combineLatest, defer, distinctUntilChanged,
  filter, map, of, shareReplay, startWith, switchMap, take, tap,
} from 'rxjs';
import { Category } from '@core/models/category/category';
import { AppError, toAppError } from '@core/models/errors/api-error.model';
import { ProductPreview } from '@core/models/product/product-summary';
import { HybridSearchInterpretation } from '@core/models/search/hybrid-search.model';
import { CategoryService } from '@core/services/category/category';
import { LoggerService } from '@core/services/logger/logger';
import { MarketService } from '@core/services/market/market';
import { ProductService } from '@core/services/product/product';
import { HYBRID_SEARCH_LIMITS, HybridSearchService } from '@core/services/search/hybrid-search';
import { ProductListFilters, sameProductListFilters, usesSmartSearch } from './product-list-filters';
import { SearchProduct, mapSearchResultToProduct } from './product-search-result';

interface CategoryOptionsState {
  marketCode: string;
  categories: Category[];
  isLoading: boolean;
  error: string | null;
}

interface CatalogState {
  filters: ProductListFilters;
  category: Category | null;
  products: ProductPreview[];
  relatedProducts: SearchProduct[];
  interpretation: HybridSearchInterpretation | null;
  isLoading: boolean;
  error: AppError | null;
  categoryResolutionError: string | null;
  page: number;
  total: number;
  totalPages: number;
  failedPage: number | null;
}

function initialCatalogState(filters: ProductListFilters): CatalogState {
  return {
    filters,
    category: null,
    products: [],
    relatedProducts: [],
    interpretation: null,
    isLoading: false,
    error: null,
    categoryResolutionError: null,
    page: 1,
    total: 0,
    totalPages: 0,
    failedPage: null,
  };
}

/** Owns one catalog's filters, categories, searches, and pagination. */
@Injectable()
export class ProductCatalog {
  private readonly destroyRef = inject(DestroyRef);
  private readonly productsApi = inject(ProductService);
  private readonly searchApi = inject(HybridSearchService);
  private readonly categoriesApi = inject(CategoryService);
  private readonly market = inject(MarketService);
  private readonly logger = inject(LoggerService);
  private readonly pageRequests = new Subject<number>();
  private readonly refreshRequests = new Subject<void>();
  private readonly categoryRefreshRequests = new Subject<void>();
  private readonly state = signal(initialCatalogState({
    search: '', categoryCode: '', dimension: '', maxDimensionCm: null,
  }));
  private readonly categoryState = signal<CategoryOptionsState>({
    marketCode: '', categories: [], isLoading: true, error: null,
  });
  private readonly marketCode$ = toObservable(this.market.selectedMarket).pipe(
    map(market => market.code),
    distinctUntilChanged(),
  );
  private readonly categoryOptions$ = combineLatest([
    this.marketCode$,
    this.categoryRefreshRequests.pipe(startWith(undefined)),
  ]).pipe(
    switchMap(([marketCode]) => this.loadCategories(marketCode)),
    tap(state => this.categoryState.set(state)),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  readonly filters = computed(() => this.state().filters);
  readonly activeCategory = computed(() => this.state().category);
  readonly useSmartSearch = computed(() => usesSmartSearch(this.filters()));
  readonly displayProducts = computed(() => this.state().products);
  readonly relatedProducts = computed(() => this.state().relatedProducts);
  readonly interpretation = computed(() => this.state().interpretation);
  readonly displayLoading = computed(() => this.state().isLoading);
  readonly displayError = computed(() =>
    this.categoryResolutionError() ?? this.state().error?.message ?? null
  );
  readonly categoryResolutionError = computed(() => this.state().categoryResolutionError);
  readonly canRetryDisplayError = computed(() => Boolean(
    this.categoryResolutionError()
    || (this.useSmartSearch() && this.state().error)
    || this.state().error?.retryable,
  ));
  readonly total = computed(() => this.state().total);
  readonly hasNextPage = computed(() =>
    !this.useSmartSearch() && this.state().page < this.state().totalPages
  );
  readonly isLoadingMore = computed(() => this.displayLoading() && this.displayProducts().length > 0);
  readonly categories = computed(() => this.categoryState().categories);
  readonly isLoadingCategories = computed(() => this.categoryState().isLoading);
  readonly categoryListError = computed(() => this.categoryState().error);

  constructor() {
    // Category options must not delay an unfiltered product request.
    this.categoryOptions$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  connect(filters$: Observable<ProductListFilters>): void {
    combineLatest([
      filters$.pipe(distinctUntilChanged(sameProductListFilters)),
      this.marketCode$,
      this.refreshRequests.pipe(startWith(undefined)),
    ]).pipe(
      // Cancel the previous search, including pagination, before resolving the new category.
      switchMap(([filters, marketCode]) => {
        this.state.set({ ...initialCatalogState(filters), isLoading: true });
        return this.resolveCategory(filters.categoryCode, marketCode).pipe(
          switchMap(category => {
            this.state.update(state => ({ ...state, category }));
            return this.pageRequests.pipe(
              startWith(1),
              switchMap(page => this.loadProducts(filters, marketCode, category, page)),
            );
          }),
        );
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe();
  }

  loadMore(): void {
    if (this.displayLoading() || !this.hasNextPage()) return;
    this.pageRequests.next(this.state().page + 1);
  }

  retryProducts(): void {
    if (this.displayLoading() || !this.canRetryDisplayError()) return;
    if (this.categoryResolutionError()) {
      if (this.categoryListError()) this.retryCategories();
      else this.refreshRequests.next();
    } else {
      const failedPage = this.state().failedPage;
      if (failedPage !== null) this.pageRequests.next(failedPage);
    }
  }

  retryCategories(): void {
    if (this.isLoadingCategories()) return;
    const needsResolution = Boolean(this.categoryResolutionError());
    this.categoryRefreshRequests.next();
    if (needsResolution) this.refreshRequests.next();
  }

  private loadCategories(marketCode: string): Observable<CategoryOptionsState> {
    const loading: CategoryOptionsState = { marketCode, categories: [], isLoading: true, error: null };
    const locale = this.market.locale();
    return defer(() => this.categoriesApi.getCategories()).pipe(
      map((categories): CategoryOptionsState => ({
        marketCode,
        categories: [...categories].sort((a, b) =>
          a.name.localeCompare(b.name, locale, { sensitivity: 'base' })
        ),
        isLoading: false,
        error: null,
      })),
      catchError((error: unknown) => {
        this.logger.error('Catalog categories failed to load', error, 'ProductCatalog');
        return of<CategoryOptionsState>({
          ...loading, isLoading: false, error: 'No pudimos cargar las categorías. Inténtalo de nuevo.',
        });
      }),
      startWith(loading),
    );
  }

  private resolveCategory(code: string, marketCode: string): Observable<Category | null> {
    if (!code) return of(null);
    return this.categoryOptions$.pipe(
      filter(state => state.marketCode === marketCode && !state.isLoading),
      take(1),
      map(state => {
        const category = state.categories.find(category => category.code === code);
        if (!category) throw new Error(`Selectable category ${code} not found`);
        return category;
      }),
      catchError((error: unknown) => {
        if (!this.categoryListError()) {
          this.logger.error('Category resolution failed', error, 'ProductCatalog');
        }
        this.state.update(state => ({
          ...state,
          isLoading: false,
          categoryResolutionError: this.categoryListError()
            ?? 'No pudimos cargar esta categoría. Inténtalo de nuevo.',
        }));
        return EMPTY;
      }),
    );
  }

  private loadProducts(
    filters: ProductListFilters,
    marketCode: string,
    category: Category | null,
    page: number,
  ): Observable<unknown> {
    return defer(() => {
      this.state.update(state => ({ ...state, isLoading: true, error: null, failedPage: null }));
      if (usesSmartSearch(filters)) {
        return this.searchApi.search(filters.search, HYBRID_SEARCH_LIMITS.PRODUCT_LIST).pipe(
          tap(response => this.state.update(state => ({
            ...state,
            products: response.results.map(mapSearchResultToProduct),
            relatedProducts: (response.relatedResults ?? []).map(mapSearchResultToProduct),
            interpretation: response.interpretation,
            isLoading: false,
            total: response.results.length,
          }))),
        );
      }

      return this.productsApi.searchProducts({
        page,
        search: filters.search,
        marketCode,
        categoryId: category?.id,
        dimension: filters.dimension || undefined,
        maxDimensionCm: filters.maxDimensionCm ?? undefined,
      }, { errorFeedback: 'local' }).pipe(
        tap(response => this.state.update(state => ({
          ...state,
          products: page === 1 ? response.data : [...state.products, ...response.data],
          isLoading: false,
          page: response.page,
          total: response.total,
          totalPages: response.totalPages,
        }))),
      );
    }).pipe(
      catchError((error: unknown) => {
        const smartSearch = usesSmartSearch(filters);
        this.logger.error(smartSearch ? 'Hybrid search failed' : 'Catalog search failed', error, 'ProductCatalog');
        this.state.update(state => ({
          ...state,
          isLoading: false,
          error: toAppError(error, {
            fallbackMessage: smartSearch
              ? 'No pudimos completar la búsqueda. Inténtalo de nuevo.'
              : 'No pudimos cargar los productos.',
          }),
          failedPage: page,
        }));
        return EMPTY;
      }),
    );
  }
}
