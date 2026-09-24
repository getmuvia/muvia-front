import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ProductStore } from '@core/services/product/product.store';
import { UserService } from '@core/services/user/user';
import { UploadFileService } from '@core/services/uploadFile/upload-file';
import { LoggerService } from '@core/services/logger/logger';
import { AuthService } from '@core/auth/services/auth';
import { ImageOptimizerService } from '@core/services/image-optimizer/image-optimizer.service';
import { STORE_CONFIG } from '@core/store/store.config';
import { Skeleton } from '@shared/components/loaders/skeleton/skeleton';
import { Pagination } from '@shared/components/pagination/pagination';
import { ImageEditorModal } from '../components/modals/image-editor-modal/image-editor-modal';
import {
  ProfileMetadataEditModal,
  ProfileMetadataFormData,
} from '../components/modals/profile-metadata-edit-modal/profile-metadata-edit-modal';
import { SidebarEditModal, SidebarFormData } from '../components/modals/sidebar-edit-modal/sidebar-edit-modal';
import {
  SellerCoverBanner,
  SellerProductGrid,
  SellerProfileHeader,
  SellerSidebar,
} from './components';
import { firstValueFrom } from 'rxjs';
import { getErrorMessage } from '@core/models/errors/api-error.model';

@Component({
  selector: 'app-seller-profile',
  imports: [
    SellerCoverBanner,
    SellerProfileHeader,
    SellerSidebar,
    SellerProductGrid,
    ImageEditorModal,
    ProfileMetadataEditModal,
    SidebarEditModal,
    Skeleton,
    Pagination
  ],
  templateUrl: './seller-profile.html',
  styleUrl: './seller-profile.css',
  providers: [ProductStore]
})
export class SellerProfile implements OnInit {
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
  currentProductPage = signal(STORE_CONFIG.PAGINATION.DEFAULT_PAGE);
  totalProductPages = computed(() =>
    Math.ceil(this.products().length / STORE_CONFIG.PAGINATION.DEFAULT_LIMIT)
  );
  visibleProducts = computed(() => {
    const start = (this.currentProductPage() - 1) * STORE_CONFIG.PAGINATION.DEFAULT_LIMIT;
    return this.products().slice(start, start + STORE_CONFIG.PAGINATION.DEFAULT_LIMIT);
  });

  isProfileLoading = computed(() =>
    this.userService.isVendorProfileLoading() && !this.userService.vendorProfile()
  );
  isProfileError = computed(() =>
    !!this.userService.vendorProfileError() && !this.userService.vendorProfile()
  );
  profileError = this.userService.vendorProfileError;
  isProductsLoading = this.productStore.isLoading;
  isProductsError = this.productStore.isError;
  productsError = computed(() => this.productStore.error()?.message ?? null);
  canRetryProducts = computed(() => this.productStore.error()?.retryable ?? false);

  isModalOpen = signal(false);
  modalTitle = signal('');
  activeField = signal<'coverImage' | 'logoUrl' | null>(null);
  isSaving = signal(false);
  imageSaveError = signal<string | null>(null);
  metadataSaveError = signal<string | null>(null);
  sidebarSaveError = signal<string | null>(null);

  isSidebarModalOpen = signal(false);
  isMetadataModalOpen = signal(false);

  metadataData = computed(() => ({
    businessName: this.sellerName(),
    description: this.sellerDescription(),
  }));

  sidebarData = computed(() => ({
    aboutMe: this.aboutText(),
    businessHours: this.businessHours(),
    socialLinks: this.socialLinks()
  }));

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;

    this.userService.loadVendorProfile(userId);
    this.productStore.loadUserProducts();
  }

  changeProductPage(page: number): void {
    if (page < 1 || page > this.totalProductPages() || page === this.currentProductPage()) return;
    this.currentProductPage.set(page);
  }

  retryProducts(): void {
    if (!this.isProductsLoading() && this.canRetryProducts()) {
      this.productStore.loadUserProducts();
    }
  }

  retryProfile(): void {
    const userId = this.auth.currentUser()?.id;
    if (userId && !this.userService.isVendorProfileLoading()) {
      this.userService.loadVendorProfile(userId);
    }
  }

  openEditModal(type: 'cover' | 'avatar') {
    this.imageSaveError.set(null);
    if (type === 'cover') {
      this.modalTitle.set('Editar Portada');
      this.activeField.set('coverImage');
    } else {
      this.modalTitle.set('Editar Logo');
      this.activeField.set('logoUrl');
    }
    this.isModalOpen.set(true);
  }

  openMetadataModal(): void {
    this.metadataSaveError.set(null);
    this.isMetadataModalOpen.set(true);
  }

  openSidebarModal(): void {
    this.sidebarSaveError.set(null);
    this.isSidebarModalOpen.set(true);
  }

  async onSaveImage(file: File) {
    const field = this.activeField();
    const userId = this.auth.currentUser()?.id;
    if (!field || !userId) return;

    this.isSaving.set(true);
    this.imageSaveError.set(null);
    let uploadedKey: string | null = null;

    // 0. Optimize Image
    let fileToUpload = file;
    if (file.type.startsWith('image/')) {
      try {
        fileToUpload = await this.imageOptimizer.compressImage(file);
      } catch (error) {
        this.logger.warn('Image optimization failed; using the original file', error, 'SellerProfile');
      }
    }

    try {
      const response = await firstValueFrom(
        this.uploadFileService.uploadFile(fileToUpload, `users/${userId}`, 'local')
      );
      uploadedKey = response.key;
      const payload = { vendorProfile: { [field]: response.url } };
      await firstValueFrom(this.userService.updateProfile(payload));
      this.isModalOpen.set(false);
    } catch (error) {
      this.logger.error('Failed to save profile image', error, 'SellerProfile');
      if (uploadedKey) {
        try {
          await firstValueFrom(this.uploadFileService.deleteFile(uploadedKey));
        } catch (cleanupError) {
          this.logger.error('Failed to clean up profile image upload', cleanupError, 'SellerProfile');
        }
      }
      this.imageSaveError.set(getErrorMessage(
        error,
        'No pudimos guardar la imagen. Revisa tu conexión e inténtalo nuevamente.',
      ));
    } finally {
      this.isSaving.set(false);
    }
  }

  async onSaveSidebarInfo(data: SidebarFormData): Promise<void> {
    this.isSaving.set(true);
    this.sidebarSaveError.set(null);
    const payload = { vendorProfile: data };
    try {
      await firstValueFrom(this.userService.updateProfile(payload));
      this.isSidebarModalOpen.set(false);
    } catch (error) {
      this.logger.error('Failed to update sidebar info', error, 'SellerProfile');
      this.sidebarSaveError.set(getErrorMessage(
        error,
        'No pudimos guardar la información. Tus cambios siguen en el formulario.',
      ));
    } finally {
      this.isSaving.set(false);
    }
  }

  async onSaveMetadata(data: ProfileMetadataFormData): Promise<void> {
    this.isSaving.set(true);
    this.metadataSaveError.set(null);
    try {
      await firstValueFrom(this.userService.updateProfile({ vendorProfile: data }));
      this.isMetadataModalOpen.set(false);
    } catch (error) {
      this.logger.error('Failed to update profile metadata', error, 'SellerProfile');
      this.metadataSaveError.set(getErrorMessage(
        error,
        'No pudimos guardar el perfil. Tus cambios siguen en el formulario.',
      ));
    } finally {
      this.isSaving.set(false);
    }
  }

}
