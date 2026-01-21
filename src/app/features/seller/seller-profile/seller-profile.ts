import { Component, inject, signal, afterNextRender, computed } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { SellerCoverBanner } from './components/seller-cover-banner/seller-cover-banner';
import { SellerProfileHeader } from './components/seller-profile-header/seller-profile-header';
import { SellerSidebar } from './components/seller-sidebar/seller-sidebar';
import { SellerFilterChips } from './components/seller-filter-chips/seller-filter-chips';
import { SellerProductGrid } from './components/seller-product-grid/seller-product-grid';
import { SellerPagination } from './components/seller-pagination/seller-pagination';
import { ImageEditorModal } from '@shared/components/modals/image-editor-modal/image-editor-modal';
import { SidebarEditModal } from '@shared/components/modals/sidebar-edit-modal/sidebar-edit-modal';
import { Product } from '@core/models/product/product';
import { ProductStore } from '@core/services/product/product';
import { UserService } from '@core/services/user/user';
import { UploadFileService } from '@core/services/uploadFile/upload-file';
import { AuthService } from '@core/auth/services/auth';
import { Skeleton } from '@shared/components/loaders/skeleton/skeleton';

@Component({
  selector: 'app-seller-profile',
  imports: [
    SellerCoverBanner,
    SellerProfileHeader,
    SellerSidebar,
    SellerFilterChips,
    SellerProductGrid,
    SellerPagination,
    ImageEditorModal,
    SidebarEditModal,
    Skeleton
  ],
  templateUrl: './seller-profile.html',
  styleUrl: './seller-profile.css',
  providers: [ProductStore]
})
export class SellerProfile {
  readonly productStore = inject(ProductStore);
  private readonly userService = inject(UserService);
  private readonly uploadFileService = inject(UploadFileService);
  private readonly auth = inject(AuthService);

  coverImageUrl = computed(() => this.userService.vendorProfile()?.coverImage || '');
  avatarUrl = computed(() => this.userService.vendorProfile()?.logoUrl || '');
  sellerName = computed(() => this.userService.vendorProfile()?.businessName || 'Nombre del Vendedor');
  sellerDescription = computed(() => this.userService.vendorProfile()?.description || '');
  aboutText = computed(() => this.userService.vendorProfile()?.aboutMe || '');
  socialLinks = computed(() => this.userService.vendorProfile()?.socialLinks || []);
  businessHours = computed(() => this.userService.vendorProfile()?.businessHours || {});

  products = this.productStore.products;

  isProfileLoading = computed(() => !this.userService.vendorProfile());
  isProductsLoading = this.productStore['isLoading'];

  currentPage = 1;
  totalPages = 8;

  isModalOpen = signal(false);
  modalTitle = signal('');
  activeField = signal<'coverImage' | 'logoUrl' | null>(null);
  isSaving = signal(false);

  isSidebarModalOpen = signal(false);

  sidebarData = computed(() => ({
    aboutMe: this.aboutText(),
    businessHours: this.businessHours(),
    socialLinks: this.socialLinks()
  }));

  constructor() {
    afterNextRender(() => {
      this.loadData();
    });
  }

  private loadData(): void {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;

    this.userService.loadVendorProfile(userId);
    this.productStore.loadUserProducts();
  }

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

    this.isSaving.set(true);

    // 1. Upload File
    this.uploadFileService.uploadFile(file, `users/${userId}`).subscribe({
      next: (response) => {
        const url = response.url;

        // 2. Update Profile (Service handles optimistic update)
        const updateData = { [field]: url };
        const payload = { vendorProfile: updateData };

        this.userService.updateProfile(payload).subscribe({
          next: () => {
            this.isModalOpen.set(false);
            this.isSaving.set(false);
          },
          error: (error: HttpErrorResponse) => {
            console.error('Error updating profile:', error);
            this.isSaving.set(false);
          }
        });
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error uploading file:', error);
        this.isSaving.set(false);
      }
    });
  }

  onSaveSidebarInfo(data: any) {
    this.isSaving.set(true);
    const payload = { vendorProfile: data };
    this.userService.updateProfile(payload).subscribe({
      next: () => {
        this.isSidebarModalOpen.set(false);
        this.isSaving.set(false);
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error updating sidebar info:', error);
        this.isSaving.set(false);
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
