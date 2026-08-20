import { Component, inject, signal, afterNextRender, computed, ChangeDetectionStrategy } from '@angular/core';
import { ProductStore } from '@core/services/product/product.store';
import { UserService } from '@core/services/user/user';
import { UploadFileService } from '@core/services/uploadFile/upload-file';
import { LoggerService } from '@core/services/logger/logger';
import { AuthService } from '@core/auth/services/auth';
import { ImageOptimizerService } from '@core/services/image-optimizer/image-optimizer.service';
import { Skeleton } from '@shared/components/loaders/skeleton/skeleton';
import { ImageEditorModal } from '../components/modals/image-editor-modal/image-editor-modal';
import { SidebarEditModal, SidebarFormData } from '../components/modals/sidebar-edit-modal/sidebar-edit-modal';
import { SellerCoverBanner, SellerProfileHeader, SellerSidebar, SellerFilterChips, SellerProductGrid, SellerPagination } from './components';
import { firstValueFrom } from 'rxjs';

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
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ProductStore]
})
export class SellerProfile {
  private readonly logger = inject(LoggerService);
  readonly productStore = inject(ProductStore);
  private readonly userService = inject(UserService);
  private readonly uploadFileService = inject(UploadFileService);
  private readonly auth = inject(AuthService);
  private readonly imageOptimizer = inject(ImageOptimizerService);

  coverImageUrl = computed(() => this.userService.vendorProfile()?.coverImage || '');
  avatarUrl = computed(() => this.userService.vendorProfile()?.logoUrl || '');
  sellerName = computed(() => this.userService.vendorProfile()?.businessName || 'Nombre del Vendedor');
  sellerDescription = computed(() => this.userService.vendorProfile()?.description || '');
  aboutText = computed(() => this.userService.vendorProfile()?.aboutMe || '');
  socialLinks = computed(() => this.userService.vendorProfile()?.socialLinks || []);
  businessHours = computed(() => this.userService.vendorProfile()?.businessHours || {});

  products = this.productStore.products;

  isProfileLoading = computed(() => !this.userService.vendorProfile());
  isProductsLoading = this.productStore.isLoading;

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

  async onSaveImage(file: File) {
    const field = this.activeField();
    const userId = this.auth.currentUser()?.id;
    if (!field || !userId) return;

    this.isSaving.set(true);

    // 0. Optimize Image
    let fileToUpload = file;
    if (file.type.startsWith('image/')) {
      try {
        fileToUpload = await this.imageOptimizer.compressImage(file);
      } catch (error) {
        this.logger.error('Failed to optimize image', error, 'SellerProfile');
      }
    }

    try {
      const response = await firstValueFrom(
        this.uploadFileService.uploadFile(fileToUpload, `users/${userId}`)
      );
      const payload = { vendorProfile: { [field]: response.url } };
      await firstValueFrom(this.userService.updateProfile(payload));
      this.isModalOpen.set(false);
    } catch (error) {
      this.logger.error('Failed to save profile image', error, 'SellerProfile');
    } finally {
      this.isSaving.set(false);
    }
  }

  async onSaveSidebarInfo(data: SidebarFormData): Promise<void> {
    this.isSaving.set(true);
    const payload = { vendorProfile: data };
    try {
      await firstValueFrom(this.userService.updateProfile(payload));
      this.isSidebarModalOpen.set(false);
    } catch (error) {
      this.logger.error('Failed to update sidebar info', error, 'SellerProfile');
    } finally {
      this.isSaving.set(false);
    }
  }

  onFollow(): void {
    // TODO: Implement follow functionality
  }

  onContact(): void {
    // TODO: Implement contact functionality
  }

  onFilterChange(filterId: string): void {
    // TODO: Implement filter change
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    // TODO: Re-fetch products for new page
  }
}
