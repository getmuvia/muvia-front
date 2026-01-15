import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProductService } from '@core/services/product/product';
import { Product } from '@core/models/product/product';
import { ImageGallery, ProductInfo, ProductTabs, SimilarProducts } from './components';

@Component({
  selector: 'app-product-detail',
  imports: [RouterLink, ImageGallery, ProductInfo, ProductTabs, SimilarProducts],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.css',
})
export class ProductDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly productService = inject(ProductService);

  product = signal<Product | null>(null);
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);
  similarProducts = signal<Product[]>([]);

  ngOnInit(): void {
    const productId = this.route.snapshot.paramMap.get('id');
    if (productId) {
      this.loadProduct(productId);
    } else {
      this.error.set('ID de producto no válido');
      this.isLoading.set(false);
    }
  }

  loadProduct(id: string): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.productService.getProductById(id).subscribe({
      next: (product) => {
        this.product.set(product);
        this.isLoading.set(false);

        this.loadSimilarProducts(product.categoryId, product.id);
      },
      error: (err) => {
        console.error('Error loading product:', err);
        this.error.set('No se pudo cargar el producto');
        this.isLoading.set(false);
      }
    });
  }

  loadSimilarProducts(categoryId: string, excludeId: string): void {
    this.productService.getAllProducts({ page: 1, limit: 5 }).subscribe({
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
