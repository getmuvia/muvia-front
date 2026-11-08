import { isPlatformBrowser } from '@angular/common';
import { DestroyRef, Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import {
  Subject, Subscription, catchError, combineLatest, distinctUntilChanged,
  filter, map, of, startWith, switchMap,
} from 'rxjs';
import { ProductSummary } from '@core/models/product/product-summary';
import { LoggerService } from '@core/services/logger/logger';
import { MarketService } from '@core/services/market/market';
import { ProductService } from './product';

interface NewArrivalsState {
  marketCode: string | null;
  products: ProductSummary[];
  isLoading: boolean;
  error: string | null;
}

function initialState(): NewArrivalsState {
  return { marketCode: null, products: [], isLoading: true, error: null };
}

/** Shares the home bootstrap request with its view, releasing it when the view leaves. */
@Injectable({ providedIn: 'root' })
export class NewArrivalsStore {
  private readonly productsApi = inject(ProductService);
  private readonly market = inject(MarketService);
  private readonly logger = inject(LoggerService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private readonly marketCode$ = toObservable(this.market.selectedMarket).pipe(
    map(market => market.code),
  );
  private readonly refreshRequests = new Subject<void>();
  private readonly state = signal(initialState());
  private subscription: Subscription | null = null;
  private consumers = 0;

  readonly products = computed(() => this.state().products);
  readonly isLoading = computed(() => this.state().isLoading);
  readonly error = computed(() => this.state().error);
  readonly isInitialLoading = computed(() => this.isLoading() && this.products().length === 0);
  readonly isRefreshing = computed(() => this.isLoading() && this.products().length > 0);

  prefetch(): void {
    if (!isPlatformBrowser(this.platformId) || this.subscription) return;

    this.subscription = combineLatest([
      // Start HTTP immediately; the signal observable first emits during change detection.
      this.marketCode$.pipe(
        startWith(this.market.selectedMarket().code),
        // A replayed value can lag behind a market change between home visits.
        filter(code => code === this.market.selectedMarket().code),
        distinctUntilChanged(),
      ),
      this.refreshRequests.pipe(startWith(undefined)),
    ]).pipe(
      switchMap(([marketCode]) => {
        const current = this.state();
        const loading: NewArrivalsState = {
          marketCode,
          products: current.marketCode === marketCode ? current.products : [],
          isLoading: true,
          error: null,
        };
        this.state.set(loading);

        return this.productsApi.searchProducts({
          page: 1, limit: 4, search: '', marketCode,
        }, { errorFeedback: 'none' }).pipe(
          map((response): NewArrivalsState => ({
            ...loading, products: response.data, isLoading: false,
          })),
          catchError(error => {
            this.logger.error('Failed to load new arrivals', error, 'NewArrivals');
            return of<NewArrivalsState>({
              ...loading,
              isLoading: false,
              error: 'No pudimos cargar las novedades. Inténtalo nuevamente.',
            });
          }),
        );
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(state => this.state.set(state));
  }

  connect(): () => void {
    if (!isPlatformBrowser(this.platformId)) return () => {};

    this.consumers++;
    this.prefetch();

    return () => {
      this.consumers--;
      if (this.consumers === 0) {
        this.subscription?.unsubscribe();
        this.subscription = null;
        this.state.set(initialState());
      }
    };
  }

  retry(): void {
    if (!this.isLoading()) this.refreshRequests.next();
  }
}
