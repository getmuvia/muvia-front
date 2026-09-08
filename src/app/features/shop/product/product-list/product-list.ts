import { Component, inject, signal, computed, OnInit, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { ProductStore } from '@core/services/product/product.store';
import { HybridSearchService, HYBRID_SEARCH_LIMITS } from '@core/services/search/hybrid-search';
import { LoggerService } from '@core/services/logger/logger';
import { Product } from '@core/models/product/product';
import { HybridSearchResult } from '@core/models/search/hybrid-search.model';
import { MarketService } from '@core/services/market/market';
import { SEARCH_INPUT_CONFIG } from '@core/constants/search-input';
import { PageHeader, FilterBar, ProductGrid, LoadMoreButton } from './components';
import { EMPTY, Subject, catchError, combineLatest, distinctUntilChanged, map, of, switchMap, tap } from 'rxjs';

import { ActivatedRoute, Router } from '@angular/router';

type SearchProduct = Product & Pick<HybridSearchResult, 'score' | 'matchType'>;

@Component({
  selector: 'app-product-list',
  imports: [PageHeader, FilterBar, ProductGrid, LoadMoreButton],
  templateUrl: './product-list.html',
  styleUrl: './product-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ProductStore]
})
export class ProductList implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly logger = inject(LoggerService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly store = inject(ProductStore);
  private readonly hybridSearchService = inject(HybridSearchService);
  private readonly marketService = inject(MarketService);
  private readonly hybridSearchRequests = new Subject<string>();
  private readonly selectedMarketCode$ = toObservable(this.marketService.selectedMarket).pipe(
    map(market => market.code),
    distinctUntilChanged(),
  );

  isLoadingMore = computed(() =>
    !this.useSmartSearch() && this.store.isLoading() && this.store.products().length > 0
  );

  searchQuery = signal<string>('');
  useSmartSearch = signal<boolean>(false);

  hybridResults = signal<SearchProduct[]>([]);
  relatedProducts = signal<SearchProduct[]>([]);
  hybridLoading = signal<boolean>(false);
  hybridError = signal<string | null>(null);

  displayProducts = computed(() =>
    this.useSmartSearch() ? this.hybridResults() : this.store.products()
  );
  displayLoading = computed(() =>
    this.useSmartSearch() ? this.hybridLoading() : this.store.isLoading()
  );
  displayError = computed(() => this.useSmartSearch()
    ? this.hybridError()
    : this.store.isError() ? 'No pudimos cargar los productos. Inténtalo de nuevo.' : null
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
        map(params => (params.get('search') ?? '').trim()),
        distinctUntilChanged(),
      ),
      this.selectedMarketCode$,
    ]).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(([query, marketCode]) => {
      this.searchProducts(query, marketCode);
    });
  }

  loadMore(): void {
    if (this.useSmartSearch()) return;
    if (this.store.isLoading() || !this.store.hasNextPage()) return;

    this.store.searchProducts({
      page: this.store.page() + 1,
      search: this.searchQuery()
    });
  }

  /**
   * Initiates product search.
   * Switches between "Smart Search" (Hybrid) and normal SQL search based on query length.
   * 
   * @param query Search term from URL or input
   */
  searchProducts(query: string, marketCode = this.marketService.selectedMarket().code): void {
    query = query.trim();
    const effectiveQuery = query.length >= SEARCH_INPUT_CONFIG.MIN_QUERY_LENGTH ? query : '';
    this.searchQuery.set(effectiveQuery);

    if (effectiveQuery) {
      this.useSmartSearch.set(true);
      this.performHybridSearch(effectiveQuery);
    } else {
      this.hybridSearchRequests.next('');
      this.useSmartSearch.set(false);
      this.store.searchProducts({
        page: 1,
        search: '',
        marketCode,
      });
    }
  }

  retryProducts(): void {
    if (this.displayLoading()) return;

    if (!this.useSmartSearch() && this.store.products().length > 0) {
      this.loadMore();
      return;
    }

    this.searchProducts(this.searchQuery());
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
    this.searchProducts('');

    // Clear URL query params
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { search: null },
      queryParamsHandling: 'merge'
    });
  }
}
