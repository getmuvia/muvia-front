import { Component, inject, signal, afterNextRender } from '@angular/core';
import { SellerCoverBanner } from './components/seller-cover-banner/seller-cover-banner';
import { SellerProfileHeader } from './components/seller-profile-header/seller-profile-header';
import { SellerSidebar } from './components/seller-sidebar/seller-sidebar';
import { SellerFilterChips } from './components/seller-filter-chips/seller-filter-chips';
import { SellerProductGrid } from './components/seller-product-grid/seller-product-grid';
import { SellerPagination } from './components/seller-pagination/seller-pagination';
import { Product } from '@core/models/product/product';
import { ProductService } from '@core/services/product/product';

@Component({
  selector: 'app-seller-profile',
  imports: [
    SellerCoverBanner,
    SellerProfileHeader,
    SellerSidebar,
    SellerFilterChips,
    SellerProductGrid,
    SellerPagination
  ],
  templateUrl: './seller-profile.html',
  styleUrl: './seller-profile.css',
})
export class SellerProfile {
  private readonly productService = inject(ProductService);

  // Demo data - in real implementation, this would come from a service
  coverImageUrl = 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&h=400&fit=crop';
  avatarUrl = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop';
  sellerName = 'Atelier Chic';
  sellerDescription = 'Diseño de interiores y piezas únicas.';
  aboutText = 'Atelier Chic crea piezas de decoración atemporales que combinan artesanía tradicional con estética moderna.';
  rating = 4.7;
  totalReviews = 120;
  socialLinks = [
    { name: 'Website', url: '#', icon: 'language' as const },
    { name: 'Instagram', url: '#', icon: 'instagram' as const },
    { name: 'Pinterest', url: '#', icon: 'pinterest' as const }
  ];

  // Products from API
  products = signal<Product[]>([]);
  isLoading = signal(false);

  currentPage = 1;
  totalPages = 8;

  constructor() {
    // Load products only after hydration (client-side only)
    afterNextRender(() => {
      this.loadProducts();
    });
  }

  private loadProducts(): void {
    this.isLoading.set(true);
    this.productService.getUserProducts().subscribe({
      next: (products: Product[]) => {
        this.products.set(products);
        this.isLoading.set(false);
      },
      error: (err: unknown) => {
        console.error('Error loading products:', err);
        this.isLoading.set(false);
      }
    });
  }

  onFollow(): void {
    console.log('Follow clicked');
  }

  onContact(): void {
    console.log('Contact clicked');
  }

  onFilterChange(filterId: string): void {
    console.log('Filter changed:', filterId);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    console.log('Page changed:', page);
  }
}
