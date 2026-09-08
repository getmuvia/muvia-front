import {
  ChangeDetectionStrategy,
  Component,
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
import { distinctUntilChanged, map, switchMap } from 'rxjs';

@Component({
  selector: 'app-new-arrivals',
  imports: [ProductCard, RouterLink],
  templateUrl: './new-arrivals.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './new-arrivals.css',
})
export class NewArrivals implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly marketService = inject(MarketService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly selectedMarketCode$ = toObservable(this.marketService.selectedMarket).pipe(
    map(market => market.code),
    distinctUntilChanged(),
  );

  products = signal<Product[]>([]);
  isLoading = signal(true);

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.selectedMarketCode$
      .pipe(
        switchMap(marketCode => this.productService.searchProducts({
          page: 1,
          limit: 4,
          search: '',
          marketCode,
        })),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response) => {
          this.products.set(response.data);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
  }
}
