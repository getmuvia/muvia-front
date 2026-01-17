import { Component, inject, signal, afterNextRender } from '@angular/core';
import { SellerCoverBanner } from './components/seller-cover-banner/seller-cover-banner';
import { SellerProfileHeader } from './components/seller-profile-header/seller-profile-header';
import { SellerSidebar } from './components/seller-sidebar/seller-sidebar';
import { SellerFilterChips } from './components/seller-filter-chips/seller-filter-chips';
import { SellerProductGrid } from './components/seller-product-grid/seller-product-grid';
import { SellerPagination } from './components/seller-pagination/seller-pagination';
import { ImageEditorModal } from '@shared/components/modals/image-editor-modal/image-editor-modal';
import { Product } from '@core/models/product/product';
import { ProductService } from '@core/services/product/product';
import { UserService } from '@core/services/user/user';
import { UploadFile } from '@core/services/uploadFile/upload-file';
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
    SellerPagination,
    ImageEditorModal
  ],
  templateUrl: './seller-profile.html',
  styleUrl: './seller-profile.css',
})
export class SellerProfile {
  private readonly productService = inject(ProductService);
  private readonly userService = inject(UserService);
  private readonly uploadFileService = inject(UploadFile);
  private readonly auth = inject(Auth);

  // Profile Data Signals
  coverImageUrl = signal<string>('');
  avatarUrl = signal<string>('');
  sellerName = signal<string>('');
  sellerDescription = signal<string>('');
  aboutText = signal<string>('');
  socialLinks = signal<any[]>([]);
  businessHours = signal<BusinessHours>({});

  // Products from API
  products = signal<Product[]>([]);
  isLoading = signal(false);

  currentPage = 1;
  totalPages = 8;

  // Modal State
  isModalOpen = signal(false);
  modalTitle = signal('');
  activeField = signal<'coverImage' | 'logoUrl' | null>(null);

  constructor() {
    // Load data only after hydration
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

  // Edit Logic
  openEditModal(type: 'cover' | 'avatar') {
    if (type === 'cover') {
      this.modalTitle.set('Editar Portada');
      this.activeField.set('coverImage');
    } else {
      this.modalTitle.set('Editar Logo');
      this.activeField.set('logoUrl');
    }
    this.isModalOpen.set(true);
  }

  onSaveImage(file: File) {
    const field = this.activeField();
    const userId = this.auth.currentUser()?.id;

    if (!field || !userId) return;

    // 1. Upload File
    this.uploadFileService.uploadFile(file, `users/${userId}`).subscribe({
      next: (response) => {
        const url = response.url;

        // 2. Update Profile with new URL
        const updateData = { [field]: url };

        this.userService.updateProfile(updateData).subscribe({
          next: () => {
            // 3. Update Local State
            if (field === 'coverImage') this.coverImageUrl.set(url);
            if (field === 'logoUrl') this.avatarUrl.set(url);

            this.isModalOpen.set(false);
          },
          error: (err) => console.error('Error updating profile:', err)
        });
      },
      error: (err) => console.error('Error uploading file:', err)
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
