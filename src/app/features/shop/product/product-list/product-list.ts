import { Component, inject, signal, computed, OnInit, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { ProductStore } from '@core/services/product/product.store';
import { HybridSearchService, HYBRID_SEARCH_LIMITS } from '@core/services/search/hybrid-search';
import { LoggerService } from '@core/services/logger/logger';
import { Product } from '@core/models/product/product';
import { HybridSearchResult } from '@core/models/search/hybrid-search.model';
import { PageHeader, FilterBar, ProductGrid, LoadMoreButton } from './components';
import { EMPTY, Subject, catchError, map, of, switchMap, tap } from 'rxjs';

import { ActivatedRoute, Router } from '@angular/router';

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
  private readonly hybridSearchRequests = new Subject<string>();

  isLoadingMore = computed(() => this.store.isLoading() && this.store.products().length > 0);

  searchQuery = signal<string>('');
  useSmartSearch = signal<boolean>(false);

  hybridResults = signal<Product[]>([]);
  hybridLoading = signal<boolean>(false);
  hybridError = signal<string | null>(null);

  displayProducts = computed(() =>
    this.useSmartSearch() ? this.hybridResults() : this.store.products()
  );
  displayLoading = computed(() =>
    this.useSmartSearch() ? this.hybridLoading() : this.store.isLoading()
  );

  constructor() {
    this.hybridSearchRequests.pipe(
      tap(query => {
        if (query.length < 2) {
          this.hybridLoading.set(false);
          this.hybridError.set(null);
          this.hybridResults.set([]);
          return;
        }

        this.hybridLoading.set(true);
        this.hybridError.set(null);
      }),
      switchMap(query => query.length < 2
        ? EMPTY
        : this.hybridSearchService.search(query, HYBRID_SEARCH_LIMITS.PRODUCT_LIST).pipe(
          map(response => response.results.map(result => this.mapToProduct(result))),
          catchError((error: HttpErrorResponse) => {
            this.logger.error('Hybrid search failed', error, 'ProductList');
            this.hybridError.set('Error en la búsqueda inteligente');
            return of([] as Product[]);
          })
        )
      ),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(products => {
      this.hybridResults.set(products);
      this.hybridLoading.set(false);
    });
  }

  ngOnInit(): void {
    this.route.queryParamMap.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(params => {
      const query = params.get('search');

      if (query) {
        this.searchProducts(query);
      } else {
        const currentQuery = this.searchQuery();

        if (currentQuery) {
          this.searchProducts('');
        } else if (this.store.products().length === 0) {
          this.store.searchProducts({ page: 1, search: '' });
        }
      }
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
  searchProducts(query: string): void {
    this.searchQuery.set(query);

    if (query.length >= 2) {
      this.useSmartSearch.set(true);
      this.performHybridSearch(query);
    } else {
      this.hybridSearchRequests.next(query);
      this.useSmartSearch.set(false);
      this.store.searchProducts({
        page: 1,
        search: query
      });
    }
  }

  /**
   * Executes AI-powered hybrid search.
   * @param query Search term (must be >= 2 chars)
   */
  private performHybridSearch(query: string): void {
    this.hybridSearchRequests.next(query);
  }

  /** Map HybridSearchResult to Product format for display */
  private mapToProduct(result: HybridSearchResult): Product {
    return {
      id: result.id,
      sellerId: '',
      categoryId: '',
      title: result.title,
      description: result.description,
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
    this.hybridSearchRequests.next('');
    this.searchQuery.set('');
    this.useSmartSearch.set(false);

    // Clear URL query params
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { search: null },
      queryParamsHandling: 'merge'
    });

    // Reset to initial state
    this.store.searchProducts({ page: 1, search: '' });
  }
}
