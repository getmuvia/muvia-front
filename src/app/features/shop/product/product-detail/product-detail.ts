import { Component, computed, inject, signal, effect, input, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ProductStore } from '@core/services/product/product.store';
import { Product } from '@core/models/product/product';
import { ImageGallery, ProductInfo, ProductTabs, SimilarProducts } from './components';
import { Subject, catchError, map, of, switchMap } from 'rxjs';

@Component({
  selector: 'app-product-detail',
  imports: [RouterLink, ImageGallery, ProductInfo, ProductTabs, SimilarProducts],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.css',
  providers: [ProductStore]
})
export class ProductDetail {
  private readonly destroyRef = inject(DestroyRef);
  private readonly productStore = inject(ProductStore);
  private readonly similarProductRequests = new Subject<{ categoryId: string; excludeId: string }>();

  readonly id = input.required<string>();
  readonly product = this.productStore.selectedEntity;
  readonly isLoading = this.productStore.isLoading;
  readonly error = computed(() => this.productStore.error()?.message ?? null);
  readonly canRetry = computed(() => this.productStore.error()?.retryable ?? false);
  readonly similarProducts = signal<Product[]>([]);

  constructor() {
    effect(() => this.loadProduct(this.id()));

    effect(() => {
      const product = this.product();
      if (!product) {
        this.similarProducts.set([]);
        return;
      }

      this.loadSimilarProducts(product.categoryId, product.id);
    });

    this.similarProductRequests.pipe(
      switchMap(({ categoryId, excludeId }) =>
        this.productStore.getAllProducts({
          page: 1,
          limit: 5,
          search: '',
          categoryId,
        }).pipe(
          map(response => response.data
            .filter((product: Product) => product.id !== excludeId)
            .slice(0, 4)
          ),
          catchError(() => of([]))
        )
      ),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(products => this.similarProducts.set(products));
  }

  loadProduct(id: string): void {
    this.productStore.getProductById(id);
  }

  retryProduct(): void {
    if (!this.isLoading() && this.canRetry()) {
      this.loadProduct(this.id());
    }
  }

  loadSimilarProducts(categoryId: string, excludeId: string): void {
    this.similarProducts.set([]);
    this.similarProductRequests.next({ categoryId, excludeId });
  }

}
