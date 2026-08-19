import { Component, inject, signal, OnInit, effect, untracked, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProductStore } from '@core/services/product/product.store';
import { LoggerService } from '@core/services/logger/logger';
import { Product } from '@core/models/product/product';
import { ImageGallery, ProductInfo, ProductTabs, SimilarProducts } from './components';

@Component({
  selector: 'app-product-detail',
  imports: [RouterLink, ImageGallery, ProductInfo, ProductTabs, SimilarProducts],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.css',
  changeDetection: ChangeDetectionStrategy.Eager,
  providers: [ProductStore]
})
export class ProductDetail implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly logger = inject(LoggerService);
  private readonly route = inject(ActivatedRoute);
  private readonly productStore = inject(ProductStore);

  product = this.productStore.selectedEntity;
  isLoading = this.productStore['isLoading'];
  error = this.productStore['error'];
  similarProducts = signal<Product[]>([]);

  constructor() {
    effect(() => {
      const product = this.product();

      if (product) {
        untracked(() => this.loadSimilarProducts(product.categoryId, product.id));
      }
    });
  }

  ngOnInit(): void {
    const productId = this.route.snapshot.paramMap.get('id');
    if (productId) {
      this.loadProduct(productId);
    }
  }

  loadProduct(id: string): void {
    this.productStore.getProductById(id);
  }

  loadSimilarProducts(categoryId: string, excludeId: string): void {
    this.productStore.getAllProducts({ page: 1, limit: 5, search: '' }).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (response) => {
        const filtered = response.data.filter((p: Product) => p.id !== excludeId).slice(0, 4);
        this.similarProducts.set(filtered);
      },
      error: (error: HttpErrorResponse) => {
        this.logger.error('Failed to load similar products', error, 'ProductDetail');
      }
    });
  }

  onContactSeller(): void {
    const prod = this.product();
    if (prod?.seller) {
      // TODO: Implement contact seller modal
      alert(`Contactar a: ${prod.seller.name}`);
    }
  }
}
