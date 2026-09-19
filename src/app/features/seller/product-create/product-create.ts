import { Component, inject, signal, input, afterNextRender, DestroyRef, effect, computed } from '@angular/core';
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
import { getErrorMessage } from '@core/models/errors/api-error.model';
import { UploadResponse } from '@core/services/uploadFile/upload-file';
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

interface ResolvedProductAssets {
    images: CreateProductAsset[];
    glb: CreateProductAsset | null;
    usdz: CreateProductAsset | null;
}

class DraftFileUploadError extends Error {
    constructor(readonly fileName: string) {
        super(`Failed to upload ${fileName}`);
    }
}

class DraftSubmissionCancelledError extends Error {}

@Component({
    selector: 'app-product-create',
    imports: [ProductForm],
    templateUrl: './product-create.html',
    styleUrl: './product-create.css',
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
    hasCategoryLoadError = signal(false);
    isSubmitting = signal(false);
    submissionError = signal<string | null>(null);

    // Asset state
    keywords = signal<string[]>([]);
    imageAssets = signal<CreateProductAsset[]>([]);
    model3dGlbAsset = signal<CreateProductAsset | null>(null);
    model3dUsdzAsset = signal<CreateProductAsset | null>(null);
    originalAssets = signal<ProductAsset[]>([]);
    readonly pendingUploads = signal<ReadonlyMap<string, File>>(new Map());
    private readonly uploadedDraftFiles = new Map<string, UploadResponse>();
    private isDestroyed = false;

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
        this.destroyRef.onDestroy(() => {
            this.isDestroyed = true;
            this.revokePendingObjectUrls();
            void this.cleanupUploadedDraftFiles();
        });

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
        this.hasCategoryLoadError.set(false);
        this.categoryService.getCategories().pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: (categories) => {
                this.categories.set(categories);
                this.isLoadingCategories.set(false);
            },
            error: (error: HttpErrorResponse) => {
                this.logger.error('Failed to load categories', error, 'ProductCreate');
                this.categories.set([]);
                this.hasCategoryLoadError.set(true);
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
        this.submissionError.set(null);
        this.setPendingUpload(event.url, event.file);

        if (event.file.type.startsWith('image/')) {
            try {
                const optimizedFile = await this.imageOptimizer.compressImage(event.file);
                if (this.pendingUploads().has(event.url)) {
                    this.setPendingUpload(event.url, optimizedFile);
                }
            } catch (error) {
                this.logger.error('Failed to optimize image', error, 'ProductCreate');
            }
        }
    }

    async onFormSubmit(formValue: ProductFormData): Promise<void> {
        if (this.isSubmitting()) return;

        this.isSubmitting.set(true);
        this.submissionError.set(null);

        try {
            const resolvedAssets = await this.uploadPendingFiles();
            if (this.isDestroyed) {
                await this.cleanupUploadedDraftFiles();
                return;
            }

            const dto = this.buildProductDto(formValue, resolvedAssets);
            await this.persistProduct(dto);
            this.finalizeSuccessfulSubmission();
            await this.router.navigate(['/seller/profile']);
        } catch (error) {
            await this.cleanupUploadedDraftFiles();
            if (!(error instanceof DraftSubmissionCancelledError) && !this.isDestroyed) {
                this.logger.error('Failed to save product', error, 'ProductCreate');
                this.submissionError.set(this.getSubmissionErrorMessage(error));
            }
        } finally {
            this.isSubmitting.set(false);
        }
    }

    async onCancel(): Promise<void> {
        if (this.isSubmitting()) return;

        await this.cleanupUploadedDraftFiles();
        this.revokePendingObjectUrls();
        await this.router.navigate(['/seller/profile']);
    }

    private async uploadPendingFiles(): Promise<ResolvedProductAssets> {
        const currentUser = this.auth.currentUser();
        if (!currentUser) throw new Error('User not authenticated');

        const uploadFolder = `products/${currentUser.id}`;
        const images: CreateProductAsset[] = [];
        for (const asset of this.imageAssets()) {
            images.push(await this.resolveAsset(asset, uploadFolder));
        }

        return {
            images,
            glb: await this.resolveOptionalAsset(this.model3dGlbAsset(), uploadFolder),
            usdz: await this.resolveOptionalAsset(this.model3dUsdzAsset(), uploadFolder),
        };
    }

    private async resolveOptionalAsset(
        asset: CreateProductAsset | null,
        uploadFolder: string,
    ): Promise<CreateProductAsset | null> {
        return asset ? this.resolveAsset(asset, uploadFolder) : null;
    }

    private async resolveAsset(
        asset: CreateProductAsset,
        uploadFolder: string,
    ): Promise<CreateProductAsset> {
        if (this.isDestroyed) throw new DraftSubmissionCancelledError();

        const file = this.pendingUploads().get(asset.url);
        if (!file) return asset;

        let response = this.uploadedDraftFiles.get(asset.url);
        if (!response) {
            try {
                response = await firstValueFrom(
                    this.uploadService.uploadFile(file, uploadFolder, 'local')
                );
            } catch {
                throw new DraftFileUploadError(file.name);
            }
            this.uploadedDraftFiles.set(asset.url, response);
        }

        if (this.isDestroyed) {
            await this.deleteUploadedDraftFile(asset.url, response);
            throw new DraftSubmissionCancelledError();
        }

        return { ...asset, url: response.url };
    }

    private removePendingUpload(url: string): void {
        this.pendingUploads.update(pending => {
            if (!pending.has(url)) return pending;
            const updated = new Map(pending);
            updated.delete(url);
            return updated;
        });
        void this.deleteUploadedDraftFile(url);
    }

    private setPendingUpload(url: string, file: File): void {
        this.pendingUploads.update(pending => {
            const updated = new Map(pending);
            updated.set(url, file);
            return updated;
        });
    }

    private persistProduct(dto: CreateProductDto | UpdateProductDto): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.isEditMode()) {
                this.productStore.updateProduct({
                    id: this.id()!,
                    dto: dto as UpdateProductDto,
                    onSuccess: resolve,
                    onError: reject,
                });
                return;
            }

            this.productStore.createProduct({
                dto: dto as CreateProductDto,
                onSuccess: resolve,
                onError: reject,
            });
        });
    }

    private async cleanupUploadedDraftFiles(): Promise<void> {
        const uploads = [...this.uploadedDraftFiles.entries()];
        for (const [localUrl, upload] of uploads) {
            await this.deleteUploadedDraftFile(localUrl, upload);
        }
    }

    private async deleteUploadedDraftFile(
        localUrl: string,
        knownUpload?: UploadResponse,
    ): Promise<void> {
        const upload = knownUpload ?? this.uploadedDraftFiles.get(localUrl);
        if (!upload) return;

        try {
            await firstValueFrom(this.uploadService.deleteFile(upload.key));
            this.uploadedDraftFiles.delete(localUrl);
        } catch (error) {
            this.logger.error('Failed to clean up draft upload', error, 'ProductCreate');
        }
    }

    private finalizeSuccessfulSubmission(): void {
        this.uploadedDraftFiles.clear();
        this.revokePendingObjectUrls();
        this.pendingUploads.set(new Map());
    }

    private revokePendingObjectUrls(): void {
        for (const url of this.pendingUploads().keys()) {
            if (url.startsWith('blob:')) URL.revokeObjectURL(url);
        }
    }

    private getSubmissionErrorMessage(error: unknown): string {
        if (error instanceof DraftFileUploadError) {
            return `No pudimos subir “${error.fileName}”. Revisa tu conexión e inténtalo nuevamente; tus datos siguen guardados en el formulario.`;
        }

        if (typeof error === 'string' && error.trim()) {
            return `${error} Tus datos siguen guardados en el formulario.`;
        }

        return `${getErrorMessage(error, 'No pudimos guardar el producto.')} Tus datos siguen guardados en el formulario.`;
    }

    private buildProductDto(
        formValue: ProductFormData,
        resolvedAssets: ResolvedProductAssets,
    ): CreateProductDto | UpdateProductDto {
        const allAssets = combineAssets(
            resolvedAssets.images,
            resolvedAssets.glb,
            resolvedAssets.usdz
        );

        if (!this.isEditMode()) {
            return buildCreateDto(formValue, this.keywords(), allAssets);
        }

        const updateAssets = this.hasAssetsChanged()
            ? buildAssetsForUpdate(
                resolvedAssets.images,
                resolvedAssets.glb,
                resolvedAssets.usdz,
                this.originalAssets()
            )
            : undefined;

        return buildUpdateDto(formValue, this.keywords(), updateAssets);
    }
}
