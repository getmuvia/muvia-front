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
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProductCard } from '@shared/components/product-card/product-card';
import { Product } from '@core/models/product/product';
import { ProductService } from '@core/services/product/product';

@Component({
  selector: 'app-new-arrivals',
  imports: [ProductCard],
  templateUrl: './new-arrivals.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './new-arrivals.css',
})
export class NewArrivals implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);

  products = signal<Product[]>([]);
  isLoading = signal(true);

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.productService
      .searchProducts({ page: 1, limit: 4, search: '' })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.products.set(response.data);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
  }
}
