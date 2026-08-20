import { Component, inject, signal, effect, input, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { ProductStore } from '@core/services/product/product.store';
import { LoggerService } from '@core/services/logger/logger';
import { Product } from '@core/models/product/product';
import { ImageGallery, ProductInfo, ProductTabs, SimilarProducts } from './components';
import { EMPTY, Subject, catchError, map, switchMap } from 'rxjs';

@Component({
  selector: 'app-product-detail',
  imports: [RouterLink, ImageGallery, ProductInfo, ProductTabs, SimilarProducts],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ProductStore]
})
export class ProductDetail {
  private readonly destroyRef = inject(DestroyRef);
  private readonly logger = inject(LoggerService);
  private readonly productStore = inject(ProductStore);
  private readonly similarProductRequests = new Subject<{ categoryId: string; excludeId: string }>();

  readonly id = input.required<string>();
  readonly product = this.productStore.selectedEntity;
  readonly isLoading = this.productStore.isLoading;
  readonly error = this.productStore.error;
  readonly similarProducts = signal<Product[]>([]);

  constructor() {
    effect(() => this.loadProduct(this.id()));

    effect(() => {
      const product = this.product();
      if (product) {
        this.loadSimilarProducts(product.categoryId, product.id);
      }
    });

    this.similarProductRequests.pipe(
      switchMap(({ categoryId, excludeId }) =>
        this.productStore.getAllProducts({ page: 1, limit: 20, search: '' }).pipe(
          map(response => response.data
            .filter((product: Product) => product.categoryId === categoryId && product.id !== excludeId)
            .slice(0, 4)
          ),
          catchError((error: HttpErrorResponse) => {
            this.logger.error('Failed to load similar products', error, 'ProductDetail');
            return EMPTY;
          })
        )
      ),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(products => this.similarProducts.set(products));
  }

  loadProduct(id: string): void {
    this.productStore.getProductById(id);
  }

  loadSimilarProducts(categoryId: string, excludeId: string): void {
    this.similarProductRequests.next({ categoryId, excludeId });
  }

  onContactSeller(): void {
    const prod = this.product();
    if (prod?.seller) {
      // TODO: Implement contact seller modal
      alert(`Contactar a: ${prod.seller.name}`);
    }
  }
}
