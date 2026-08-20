import { Component, inject, signal, input, afterNextRender, DestroyRef, effect, computed, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { ProductStore } from '@core/services/product/product.store';
import { CategoryService } from '@core/services/category/category';
import { UploadFileService } from '@core/services/uploadFile/upload-file';
import { LoggerService } from '@core/services/logger/logger';
import { AuthService } from '@core/auth/services/auth';
import { ImageOptimizerService } from '@core/services/image-optimizer/image-optimizer.service';
import { firstValueFrom } from 'rxjs';
import { Category } from '@core/models/category/category';
import { Product, ProductAsset } from '@core/models/product/product';
import { ProductFormData } from '@core/models/product/product-form.model';
import { CreateProductDto, CreateProductAsset } from '@core/models/product/create-product.dto';
import { UpdateProductDto } from '@core/models/product/update-product.dto';
import { ProductForm } from './components';
import {
    mapProductToFormData,
    buildCreateDto,
    buildUpdateDto,
    extractImageAssets,
    extract3dAsset,
    checkAssetsChanged,
    buildAssetsForUpdate,
    combineAssets
} from './utils';

@Component({
    selector: 'app-product-create',
    imports: [ProductForm],
    templateUrl: './product-create.html',
    styleUrl: './product-create.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [ProductStore]
})
export class ProductCreate {
    private readonly destroyRef = inject(DestroyRef);
    private readonly logger = inject(LoggerService);
    private readonly router = inject(Router);
    private readonly productStore = inject(ProductStore);
    private readonly categoryService = inject(CategoryService);
    private readonly uploadService = inject(UploadFileService);
    private readonly auth = inject(AuthService);
    private readonly imageOptimizer = inject(ImageOptimizerService);

    // Edit mode state
    readonly id = input<string | null>(null);
    isEditMode = computed(() => !!this.id());
    isLoadingProduct = signal(false);

    // Form data (passed to child)
    formData = signal<ProductFormData | null>(null);
    categories = signal<Category[]>([]);
    isLoadingCategories = signal(true);
    isSubmitting = signal(false);

    // Asset state
    keywords = signal<string[]>([]);
    imageAssets = signal<CreateProductAsset[]>([]);
    model3dGlbAsset = signal<CreateProductAsset | null>(null);
    model3dUsdzAsset = signal<CreateProductAsset | null>(null);
    originalAssets = signal<ProductAsset[]>([]);
    readonly pendingUploads = signal<ReadonlyMap<string, File>>(new Map());

    // Asset change detection
    hasAssetsChanged = computed(() => checkAssetsChanged(
        this.originalAssets(),
        combineAssets(
            this.imageAssets(),
            this.model3dGlbAsset(),
            this.model3dUsdzAsset()
        ),
        this.pendingUploads().size
    ));

    constructor() {
        afterNextRender(() => {
            this.loadCategories();
        });

        effect(() => {
            const id = this.id();
            if (id) {
                this.isLoadingProduct.set(true);
                this.productStore.getProductById(id);
            }
        });

        effect(() => {
            const product = this.productStore.selectedEntity();
            if (product && this.isEditMode()) {
                this.populateFromProduct(product);
            }
        });
    }

    private populateFromProduct(product: Product): void {
        this.formData.set(mapProductToFormData(product));
        this.keywords.set(product.keywords || []);
        this.originalAssets.set([...product.assets]);
        this.imageAssets.set(extractImageAssets(product));
        this.model3dGlbAsset.set(extract3dAsset(product, 'glb'));
        this.model3dUsdzAsset.set(extract3dAsset(product, 'usdz'));
        this.isLoadingProduct.set(false);
    }

    private loadCategories(): void {
        this.isLoadingCategories.set(true);
        this.categoryService.getCategories().pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: (categories) => {
                this.categories.set(categories);
                this.isLoadingCategories.set(false);
            },
            error: (error: HttpErrorResponse) => {
                this.logger.error('Failed to load categories', error, 'ProductCreate');
                this.isLoadingCategories.set(false);
            }
        });
    }

    // Event handlers from child form
    onKeywordsChange(keywords: string[]): void {
        this.keywords.set(keywords);
    }

    onImagesChange(assets: CreateProductAsset[]): void {
        const activeUrls = new Set(assets.map(asset => asset.url));
        for (const url of this.pendingUploads().keys()) {
            if (!activeUrls.has(url)
                && url !== this.model3dGlbAsset()?.url
                && url !== this.model3dUsdzAsset()?.url) {
                this.removePendingUpload(url);
            }
        }
        this.imageAssets.set(assets);
    }

    onGlbAssetChange(asset: CreateProductAsset | null): void {
        const previousUrl = this.model3dGlbAsset()?.url;
        if (previousUrl && previousUrl !== asset?.url) this.removePendingUpload(previousUrl);
        this.model3dGlbAsset.set(asset);
    }

    onUsdzAssetChange(asset: CreateProductAsset | null): void {
        const previousUrl = this.model3dUsdzAsset()?.url;
        if (previousUrl && previousUrl !== asset?.url) this.removePendingUpload(previousUrl);
        this.model3dUsdzAsset.set(asset);
    }

    async onFileSelected(event: { url: string; file: File }): Promise<void> {
        let fileToUpload = event.file;

        if (fileToUpload.type.startsWith('image/')) {
            try {
                fileToUpload = await this.imageOptimizer.compressImage(fileToUpload);
            } catch (error) {
                this.logger.error('Failed to optimize image', error, 'ProductCreate');
            }
        }

        this.pendingUploads.update(pending => {
            const updated = new Map(pending);
            updated.set(event.url, fileToUpload);
            return updated;
        });
    }

    async onFormSubmit(formValue: ProductFormData): Promise<void> {
        this.isSubmitting.set(true);

        try {
            await this.uploadPendingFiles();
            const dto = this.buildProductDto(formValue);

            if (this.isEditMode()) {
                this.productStore.updateProduct({
                    id: this.id()!,
                    dto: dto as UpdateProductDto,
                    onSuccess: () => {
                        this.isSubmitting.set(false);
                        this.router.navigate(['/seller/profile']);
                    },
                    onError: (err) => {
                        this.logger.error('Failed to update product', err, 'ProductCreate');
                        this.isSubmitting.set(false);
                    }
                });
            } else {
                this.productStore.createProduct({
                    dto: dto as CreateProductDto,
                    onSuccess: () => {
                        this.isSubmitting.set(false);
                        this.router.navigate(['/seller/profile']);
                    },
                    onError: (err) => {
                        this.logger.error('Failed to create product', err, 'ProductCreate');
                        this.isSubmitting.set(false);
                    }
                });
            }
        } catch (error) {
            this.logger.error('Failed to upload files', error, 'ProductCreate');
            this.isSubmitting.set(false);
        }
    }

    onSaveDraft(formValue: ProductFormData): void {
        // TODO: Implement draft saving
        this.logger.info('Draft saved', formValue, 'ProductCreate');
    }

    onCancel(): void {
        this.router.navigate(['/seller/profile']);
    }

    private async uploadPendingFiles(): Promise<void> {
        const currentUser = this.auth.currentUser();
        if (!currentUser) throw new Error('User not authenticated');

        const userId = currentUser.id;
        const uploadFolder = `products/${userId}`;

        // Upload images
        const currentImages = this.imageAssets();
        const updatedImages = [...currentImages];

        for (let i = 0; i < updatedImages.length; i++) {
            const asset = updatedImages[i];
            const file = this.pendingUploads().get(asset.url);

            if (file) {
                const response = await firstValueFrom(this.uploadService.uploadFile(file, uploadFolder));
                updatedImages[i] = { ...asset, url: response.url };
                this.removePendingUpload(asset.url);
                URL.revokeObjectURL(asset.url);
            }
        }
        this.imageAssets.set(updatedImages);

        // Upload 3D models
        await this.upload3dModel('glb', uploadFolder);
        await this.upload3dModel('usdz', uploadFolder);
    }

    private async upload3dModel(format: 'glb' | 'usdz', uploadFolder: string): Promise<void> {
        const assetSignal = format === 'glb' ? this.model3dGlbAsset : this.model3dUsdzAsset;
        const model = assetSignal();

        if (!model) return;

        const file = this.pendingUploads().get(model.url);
        if (!file) return;

        const response = await firstValueFrom(this.uploadService.uploadFile(file, uploadFolder));
        assetSignal.set({ ...model, url: response.url });
        this.removePendingUpload(model.url);
        URL.revokeObjectURL(model.url);
    }

    private removePendingUpload(url: string): void {
        this.pendingUploads.update(pending => {
            if (!pending.has(url)) return pending;
            const updated = new Map(pending);
            updated.delete(url);
            return updated;
        });
    }

    private buildProductDto(formValue: ProductFormData): CreateProductDto | UpdateProductDto {
        const allAssets = combineAssets(
            this.imageAssets(),
            this.model3dGlbAsset(),
            this.model3dUsdzAsset()
        );

        if (!this.isEditMode()) {
            return buildCreateDto(formValue, this.keywords(), allAssets);
        }

        const updateAssets = this.hasAssetsChanged()
            ? buildAssetsForUpdate(
                this.imageAssets(),
                this.model3dGlbAsset(),
                this.model3dUsdzAsset(),
                this.originalAssets()
            )
            : undefined;

        return buildUpdateDto(formValue, this.keywords(), updateAssets);
    }
}
