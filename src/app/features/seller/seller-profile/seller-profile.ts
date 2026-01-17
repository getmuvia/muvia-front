import { Component, inject, signal, afterNextRender } from '@angular/core';
import { SellerCoverBanner } from './components/seller-cover-banner/seller-cover-banner';
import { SellerProfileHeader } from './components/seller-profile-header/seller-profile-header';
import { SellerSidebar } from './components/seller-sidebar/seller-sidebar';
import { SellerFilterChips } from './components/seller-filter-chips/seller-filter-chips';
import { SellerProductGrid } from './components/seller-product-grid/seller-product-grid';
import { SellerPagination } from './components/seller-pagination/seller-pagination';
import { Product } from '@core/models/product/product';
import { ProductService } from '@core/services/product/product';
import { UserService } from '@core/services/user/user';
import { BusinessHours } from '@core/models/user/vendor-profile';

import { Auth } from '@core/auth/services/auth';
import { VendorResponse } from '@core/models/user/vendor-profile';

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
  private readonly userService = inject(UserService);
  private readonly auth = inject(Auth);

  coverImageUrl = signal<string>('');
  avatarUrl = signal<string>('');
  sellerName = signal<string>('');
  sellerDescription = signal<string>('');
  aboutText = signal<string>('');
  socialLinks = signal<any[]>([]);
  businessHours = signal<BusinessHours>({});

  products = signal<Product[]>([]);
  isLoading = signal(false);

  currentPage = 1;
  totalPages = 8;

  constructor() {
    afterNextRender(() => {
      this.loadProfile();
      this.loadProducts();
    });
  }

  private loadProfile(): void {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;

    this.userService.getVendorProfile(userId).subscribe({
      next: (response: VendorResponse) => {
        const profile = response.vendorProfile;
        this.coverImageUrl.set(profile.coverImage || '');
        this.avatarUrl.set(profile.logoUrl || '');
        this.sellerName.set(profile.businessName || 'Nombre del Vendedor');
        this.sellerDescription.set(profile.description || '');
        this.aboutText.set(profile.aboutMe || '');
        this.socialLinks.set(profile.socialLinks || []);
        this.businessHours.set(profile.businessHours || {});
      },
      error: (err) => console.error('Error loading profile:', err)
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
