import { Component, inject, signal, OnInit, effect, untracked } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProductStore } from '@core/services/product/product';
import { Product } from '@core/models/product/product';
import { ImageGallery, ProductInfo, ProductTabs, SimilarProducts } from './components';

@Component({
  selector: 'app-product-detail',
  imports: [RouterLink, ImageGallery, ProductInfo, ProductTabs, SimilarProducts],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.css',
  providers: [ProductStore]
})
export class ProductDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly productStore = inject(ProductStore);

  product = this.productStore.selectedProduct;
  isLoading = this.productStore.isLoading;
  error = this.productStore.error;
  similarProducts = signal<Product[]>([]);

  constructor() {
    effect(() => {
      const product = this.product();
      if (product) {
        // Use untracked just in case, though similarProducts doesn't affect product
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
    // Store handles state management automatically
    this.productStore.getProductById(id);
  }

  loadSimilarProducts(categoryId: string, excludeId: string): void {
    this.productStore.getAllProducts({ page: 1, limit: 5, search: '' }).subscribe({
      next: (response) => {
        const filtered = response.data.filter(p => p.id !== excludeId).slice(0, 4);
        this.similarProducts.set(filtered);
      },
      error: (err) => {
        console.error('Error loading similar products:', err);
      }
    });
  }

  onContactSeller(): void {
    const prod = this.product();
    if (prod?.seller) {
      // For now, just log - could open a modal or navigate to seller contact page
      console.log('Contact seller:', prod.seller.name);
      alert(`Contactar a: ${prod.seller.name}`);
    }
  }
}
