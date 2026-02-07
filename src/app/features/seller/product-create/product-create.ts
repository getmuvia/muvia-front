import { Component, inject, signal, afterNextRender, DestroyRef, effect, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { form, required, minLength, submit, validate } from '@angular/forms/signals';
import { ProductStore } from '@core/services/product/product.store';
import { CategoryService } from '@core/services/category/category';
import { UploadFileService } from '@core/services/uploadFile/upload-file';
import { LoggerService } from '@core/services/logger/logger';
import { AuthService } from '@core/auth/services/auth';
import { ImageOptimizerService } from '@core/services/image-optimizer/image-optimizer.service';
import { firstValueFrom } from 'rxjs';
import { Category } from '@core/models/category/category';
import { Product, ProductAsset } from '@core/models/product/product';
import { ProductFormData, INITIAL_PRODUCT_FORM } from '@core/models/product/product-form.model';
import { CreateProductDto, CreateProductSpecifications, CreateProductAsset } from '@core/models/product/create-product.dto';
import { UpdateProductDto, UpdateProductAsset } from '@core/models/product/update-product.dto';
import { BasicInfoSection, SpecificationsSection, KeywordsSection, ImageGalleryUpload, Model3dUpload } from './components';

@Component({
    selector: 'app-product-create',
    imports: [
        BasicInfoSection,
        SpecificationsSection,
        KeywordsSection,
        ImageGalleryUpload,
        Model3dUpload
    ],
    templateUrl: './product-create.html',
    styleUrl: './product-create.css',
    providers: [ProductStore]
})
export class ProductCreate {
    private readonly destroyRef = inject(DestroyRef);
    private readonly logger = inject(LoggerService);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);
    private readonly productStore = inject(ProductStore);
    private readonly categoryService = inject(CategoryService);
    private readonly uploadService = inject(UploadFileService);
    private readonly auth = inject(AuthService);
    private readonly imageOptimizer = inject(ImageOptimizerService);

    productId = signal<string | null>(null);
    isEditMode = computed(() => !!this.productId());
    isLoadingProduct = signal(false);

    pendingUploads = new Map<string, File>();

    productModel = signal<ProductFormData>(INITIAL_PRODUCT_FORM);

    productForm = form(this.productModel, (path) => {
        required(path.title, { message: 'El título es requerido' });
        minLength(path.title, 3, { message: 'El título debe tener al menos 3 caracteres' });

        required(path.description, { message: 'La descripción es requerida' });
        minLength(path.description, 10, { message: 'La descripción debe tener al menos 10 caracteres' });

        required(path.price, { message: 'El precio es requerido' });
        validate(path.price, ({ value }) => {
            if (value() !== undefined && value() <= 0) {
                return { message: 'El precio debe ser mayor a 0', kind: 'error' };
            }
            return null;
        });

        required(path.stock, { message: 'El stock es requerido' });

        required(path.categoryId, { message: 'Selecciona una categoría' });

        // Specifications validations
        required(path.weight, { message: 'El peso es requerido' });
        required(path.material, { message: 'El material es requerido' });
        required(path.color, { message: 'El color es requerido' });

        // Dimensions validations
        required(path.dimensionWidth, { message: 'El ancho es requerido' });
        required(path.dimensionHeight, { message: 'El alto es requerido' });
        required(path.dimensionDepth, { message: 'El largo es requerido' });
    });

    categories = signal<Category[]>([]);
    keywords = signal<string[]>([]);
    imageAssets = signal<CreateProductAsset[]>([]);
    model3dGlbAsset = signal<CreateProductAsset | null>(null);
    model3dUsdzAsset = signal<CreateProductAsset | null>(null);
    isSubmitting = signal(false);
    isLoadingCategories = signal(true);

    // Original assets from backend for change detection
    originalAssets = signal<ProductAsset[]>([]);

    // Detect if assets have changed (added, removed, or modified)
    hasAssetsChanged = computed(() => {
        // If there are pending uploads, there are changes
        if (this.pendingUploads.size > 0) return true;

        const original = this.originalAssets();
        const currentImages = this.imageAssets();

        // Filter original images only
        const originalImages = original.filter(a => a.type === 'image');

        // If count changed, there are changes
        if (originalImages.length !== currentImages.length) return true;

        // Check if any original URL is missing from current (deleted)
        const currentUrls = new Set(currentImages.map(a => a.url));
        return !originalImages.every(a => currentUrls.has(a.url));
    });

    keywordsError = signal<string | null>(null);
    imagesError = signal<string | null>(null);

    constructor() {
        afterNextRender(() => {
            this.loadCategories();
            this.checkEditMode();
        });

        effect(() => {
            const product = this.productStore.selectedEntity();
            if (product && this.isEditMode()) {
                this.populateFormWithProduct(product);
            }
        });
    }

    private checkEditMode(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.productId.set(id);
            this.isLoadingProduct.set(true);
            this.productStore.getProductById(id);
        }
    }

    private populateFormWithProduct(product: Product): void {
        const dimensions = product.specifications?.dimensions;

        this.productModel.set({
            title: product.title,
            description: product.description,
            price: parseFloat(product.price),
            stock: product.stock,
            categoryId: product.categoryId,
            weight: product.specifications?.weight || '',
            material: product.specifications?.material || '',
            color: product.specifications?.color || '',
            dimensionWidth: dimensions?.width || 0,
            dimensionHeight: dimensions?.height || 0,
            dimensionDepth: dimensions?.depth || 0,
            dimensionUnit: dimensions?.unit || 'cm'
        });

        this.keywords.set(product.keywords || []);

        // Store original assets for change detection (with IDs)
        this.originalAssets.set([...product.assets]);

        const imageAssets: CreateProductAsset[] = product.assets
            .filter(a => a.type === 'image')
            .map(a => ({
                url: a.url,
                type: 'image' as const,
                isPrimary: a.isPrimary,
                metadata: a.metadata || {}
            }));
        this.imageAssets.set(imageAssets);

        const glbAsset = product.assets.find(a => a.type === 'model_3d' && a.metadata?.['format'] === 'glb');
        if (glbAsset) {
            this.model3dGlbAsset.set({
                url: glbAsset.url,
                type: 'model_3d',
                isPrimary: false,
                metadata: glbAsset.metadata || {}
            });
        }

        const usdzAsset = product.assets.find(a => a.type === 'model_3d' && a.metadata?.['format'] === 'usdz');
        if (usdzAsset) {
            this.model3dUsdzAsset.set({
                url: usdzAsset.url,
                type: 'model_3d',
                isPrimary: false,
                metadata: usdzAsset.metadata || {}
            });
        }

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

    isFieldInvalid(fieldName: keyof ProductFormData): boolean {
        const fieldSignal = this.productForm[fieldName];
        if (!fieldSignal) return false;

        const field = fieldSignal();
        return field && field.touched() && field.errors().length > 0;
    }

    onKeywordsChange(keywords: string[]): void {
        this.keywords.set(keywords);
        this.keywordsError.set(null);
    }

    onImagesChange(assets: CreateProductAsset[]): void {
        this.imageAssets.set(assets);
        this.imagesError.set(null);
    }

    onModel3dGlbChange(asset: CreateProductAsset | null): void {
        this.model3dGlbAsset.set(asset);
    }

    onModel3dUsdzChange(asset: CreateProductAsset | null): void {
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

        this.pendingUploads.set(event.url, fileToUpload);
    }

    onSubmit(event: Event): void {
        event.preventDefault();

        let hasErrors = false;

        if (this.keywords().length === 0) {
            this.keywordsError.set('Agrega al menos una palabra clave');
            hasErrors = true;
        }

        if (this.imageAssets().length === 0) {
            this.imagesError.set('Agrega al menos una imagen');
            hasErrors = true;
        }

        if (hasErrors) {
            return;
        }

        submit(this.productForm, async () => {
            await this.submitProduct();
        });
    }

    onSaveDraft(): void {
        // TODO: Implement draft saving functionality
    }

    private async submitProduct(): Promise<void> {
        this.isSubmitting.set(true);

        try {
            await this.uploadPendingFiles();
            const dto = this.buildProductDto();

            return new Promise((resolve) => {
                if (this.isEditMode()) {
                    this.productStore.updateProduct({
                        id: this.productId()!,
                        dto: dto as UpdateProductDto,
                        onSuccess: () => {
                            this.isSubmitting.set(false);
                            this.router.navigate(['/seller/profile']);
                            resolve();
                        },
                        onError: (err) => {
                            this.logger.error('Failed to update product', err, 'ProductCreate');
                            this.isSubmitting.set(false);
                            resolve();
                        }
                    });
                } else {
                    this.productStore.createProduct({
                        dto: dto as CreateProductDto,
                        onSuccess: () => {
                            this.isSubmitting.set(false);
                            this.router.navigate(['/seller/profile']);
                            resolve();
                        },
                        onError: (err) => {
                            this.logger.error('Failed to create product', err, 'ProductCreate');
                            this.isSubmitting.set(false);
                            resolve();
                        }
                    });
                }
            });
        } catch (error) {
            this.logger.error('Failed to upload files', error, 'ProductCreate');
            this.isSubmitting.set(false);
        }
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
            const file = this.pendingUploads.get(asset.url);

            if (file) {
                // Upload file
                const response = await firstValueFrom(this.uploadService.uploadFile(file, uploadFolder));

                // Update asset URL
                updatedImages[i] = {
                    ...asset,
                    url: response.url
                };

                // Remove from pending map
                this.pendingUploads.delete(asset.url);
            }
        }
        this.imageAssets.set(updatedImages);

        // Upload 3D GLB model if exists
        const glbModel = this.model3dGlbAsset();
        if (glbModel) {
            const file = this.pendingUploads.get(glbModel.url);
            if (file) {
                const response = await firstValueFrom(this.uploadService.uploadFile(file, uploadFolder));
                this.model3dGlbAsset.set({
                    ...glbModel,
                    url: response.url
                });
                this.pendingUploads.delete(glbModel.url);
            }
        }

        // Upload 3D USDZ model if exists
        const usdzModel = this.model3dUsdzAsset();
        if (usdzModel) {
            const file = this.pendingUploads.get(usdzModel.url);
            if (file) {
                const response = await firstValueFrom(this.uploadService.uploadFile(file, uploadFolder));
                this.model3dUsdzAsset.set({
                    ...usdzModel,
                    url: response.url
                });
                this.pendingUploads.delete(usdzModel.url);
            }
        }
    }

    private buildProductDto(): CreateProductDto | UpdateProductDto {
        const formValue = this.productForm().value();

        const specs: CreateProductSpecifications = {
            weight: formValue.weight,
            material: formValue.material,
            color: formValue.color,
            dimensions: {
                width: formValue.dimensionWidth,
                height: formValue.dimensionHeight,
                depth: formValue.dimensionDepth,
                unit: formValue.dimensionUnit
            }
        };

        // For create mode, always include assets
        if (!this.isEditMode()) {
            const allAssets: CreateProductAsset[] = [...this.imageAssets()];
            const glbModel = this.model3dGlbAsset();
            if (glbModel) {
                allAssets.push(glbModel);
            }
            const usdzModel = this.model3dUsdzAsset();
            if (usdzModel) {
                allAssets.push(usdzModel);
            }

            return {
                title: formValue.title,
                description: formValue.description,
                price: formValue.price,
                stock: formValue.stock,
                categoryId: formValue.categoryId,
                specifications: specs,
                keywords: this.keywords(),
                assets: allAssets
            };
        }

        // For edit mode, only include assets if they changed
        const dto: UpdateProductDto = {
            title: formValue.title,
            description: formValue.description,
            price: formValue.price,
            stock: formValue.stock,
            categoryId: formValue.categoryId,
            specifications: specs,
            keywords: this.keywords()
        };

        if (this.hasAssetsChanged()) {
            dto.assets = this.buildAssetsForUpdate();
        }

        return dto;
    }

    /**
     * Build assets array for update with proper id mapping
     * - Existing assets (same URL as original): include id
     * - New/modified assets: no id
     */
    private buildAssetsForUpdate(): UpdateProductAsset[] {
        const assets: UpdateProductAsset[] = [];

        // Map image assets
        for (const asset of this.imageAssets()) {
            const original = this.originalAssets().find(o => o.url === asset.url);
            assets.push({
                id: original?.id,
                url: asset.url,
                type: asset.type,
                isPrimary: asset.isPrimary,
                metadata: asset.metadata
            });
        }

        // Map 3D models
        const glbModel = this.model3dGlbAsset();
        if (glbModel) {
            const originalGlb = this.originalAssets().find(
                o => o.type === 'model_3d' && o.metadata?.['format'] === 'glb'
            );
            assets.push({
                id: originalGlb?.id,
                url: glbModel.url,
                type: glbModel.type,
                isPrimary: glbModel.isPrimary,
                metadata: glbModel.metadata
            });
        }

        const usdzModel = this.model3dUsdzAsset();
        if (usdzModel) {
            const originalUsdz = this.originalAssets().find(
                o => o.type === 'model_3d' && o.metadata?.['format'] === 'usdz'
            );
            assets.push({
                id: originalUsdz?.id,
                url: usdzModel.url,
                type: usdzModel.type,
                isPrimary: usdzModel.isPrimary,
                metadata: usdzModel.metadata
            });
        }

        return assets;
    }

    onCancel(): void {
        this.router.navigate(['/seller/profile']);
    }
}
