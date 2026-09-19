import {
  Component,
  computed,
  DestroyRef,
  OnInit,
  PLATFORM_ID,
  inject,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ProductCard } from '@shared/components/product-card/product-card';
import { Product } from '@core/models/product/product';
import { ProductService } from '@core/services/product/product';
import { MarketService } from '@core/services/market/market';
import { LoggerService } from '@core/services/logger/logger';
import {
  Subject,
  catchError,
  combineLatest,
  distinctUntilChanged,
  finalize,
  map,
  of,
  startWith,
  switchMap,
} from 'rxjs';

@Component({
  selector: 'app-new-arrivals',
  imports: [ProductCard, RouterLink],
  templateUrl: './new-arrivals.html',
  styleUrl: './new-arrivals.css',
})
export class NewArrivals implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly marketService = inject(MarketService);
  private readonly logger = inject(LoggerService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly refreshRequests = new Subject<void>();
  private readonly selectedMarketCode$ = toObservable(this.marketService.selectedMarket).pipe(
    map(market => market.code),
    distinctUntilChanged(),
  );

  products = signal<Product[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);
  isInitialLoading = computed(() => this.isLoading() && this.products().length === 0);
  isRefreshing = computed(() => this.isLoading() && this.products().length > 0);

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    combineLatest([
      this.selectedMarketCode$,
      this.refreshRequests.pipe(startWith(undefined)),
    ])
      .pipe(
        switchMap(([marketCode]) => {
          this.isLoading.set(true);
          this.error.set(null);

          return this.productService.searchProducts({
            page: 1,
            limit: 4,
            search: '',
            marketCode,
          }, { errorFeedback: 'none' }).pipe(
            catchError(error => {
              this.logger.error('Failed to load new arrivals', error, 'NewArrivals');
              this.error.set('No pudimos cargar las novedades. Inténtalo nuevamente.');
              return of(null);
            }),
            finalize(() => this.isLoading.set(false)),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(response => {
        if (response) {
          this.products.set(response.data);
        }
      });
  }

  retry(): void {
    if (!this.isLoading()) {
      this.refreshRequests.next();
    }
  }
}
