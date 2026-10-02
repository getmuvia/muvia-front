import { Component, inject, signal, input, afterNextRender, DestroyRef, effect, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { ProductStore } from '@core/services/product/product.store';
import { ProductService } from '@core/services/product/product';
import { CategoryService } from '@core/services/category/category';
import { LoggerService } from '@core/services/logger/logger';
import { firstValueFrom } from 'rxjs';
import { Category } from '@core/models/category/category';
import { Product, ProductAsset } from '@core/models/product/product';
import { ProductFormData } from '@core/models/product/product-form.model';
import { CreateProductDto, CreateProductAsset } from '@core/models/product/create-product.dto';
import { UpdateProductDto } from '@core/models/product/update-product.dto';
import { toAppError } from '@core/models/errors/api-error.model';
import { ProductForm } from './components';
import {
    DraftFileUploadError,
    DraftSubmissionCancelledError,
    ProductDraftAssets,
    ProductDraftFiles,
} from './product-draft-files';
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

interface ProductSubmission {
    id: string | null;
    form: ProductFormData;
    keywords: string[];
    assets: ProductDraftAssets;
    originalAssets: ProductAsset[];
    hasAssetsChanged: boolean;
}

const PRODUCT_MUTATION_OPTIONS = {
    errorFeedback: 'local',
    errorTelemetry: { expectedStatuses: [400, 409, 422] },
} as const;

@Component({
    selector: 'app-product-create',
    imports: [ProductForm],
    templateUrl: './product-create.html',
    styleUrl: './product-create.css',
    providers: [ProductStore, ProductDraftFiles]
})
export class ProductCreate {
    private readonly destroyRef = inject(DestroyRef);
    private readonly logger = inject(LoggerService);
    private readonly router = inject(Router);
    private readonly productStore = inject(ProductStore);
    private readonly productService = inject(ProductService);
    private readonly categoryService = inject(CategoryService);
    private readonly draftFiles = inject(ProductDraftFiles);

    // Edit mode state
    readonly id = input<string | null>(null);
    isEditMode = computed(() => !!this.id());

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
    private editorVersion = 0;
    private isDestroyed = false;

    readonly productLoadError = computed(() => {
        if (!this.isEditMode() || this.formData() || !this.productStore.isError()) {
            return null;
        }

        return this.productStore.error()?.message || 'No pudimos cargar el producto.';
    });

    readonly canRetryProductLoad = computed(() =>
        this.productStore.error()?.retryable ?? false
    );

    readonly isLoadingProduct = computed(() =>
        this.isEditMode() && !this.formData() && !this.productLoadError()
    );

    // Asset change detection
    hasAssetsChanged = computed(() => checkAssetsChanged(
        this.originalAssets(),
        combineAssets(
            this.imageAssets(),
            this.model3dGlbAsset(),
            this.model3dUsdzAsset()
        ),
        this.draftFiles.pendingCount()
    ));

    constructor() {
        this.destroyRef.onDestroy(() => {
            this.isDestroyed = true;
        });

        afterNextRender(() => {
            this.loadCategories();
        });

        effect(() => {
            const id = this.id();
            this.resetProductData();
            if (id) {
                this.productStore.getProductById(id);
            }
        });

        effect(() => {
            const product = this.productStore.selectedEntity();
            if (product?.id === this.id()) {
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
    }

    retryProductLoad(): void {
        const id = this.id();
        if (!id || this.productStore.isLoading() || !this.canRetryProductLoad()) return;

        this.productStore.getProductById(id);
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
        if (this.isSubmitting()) return;
        this.keywords.set(keywords);
    }

    onImagesChange(assets: CreateProductAsset[]): void {
        if (this.isSubmitting()) return;
        this.imageAssets.set(assets);
        this.draftFiles.retain(new Set(combineAssets(
            assets, this.model3dGlbAsset(), this.model3dUsdzAsset(),
        ).map(asset => asset.url)));
    }

    onGlbAssetChange(asset: CreateProductAsset | null): void {
        if (this.isSubmitting()) return;
        const previousUrl = this.model3dGlbAsset()?.url;
        if (previousUrl && previousUrl !== asset?.url) this.draftFiles.remove(previousUrl);
        this.model3dGlbAsset.set(asset);
    }

    onUsdzAssetChange(asset: CreateProductAsset | null): void {
        if (this.isSubmitting()) return;
        const previousUrl = this.model3dUsdzAsset()?.url;
        if (previousUrl && previousUrl !== asset?.url) this.draftFiles.remove(previousUrl);
        this.model3dUsdzAsset.set(asset);
    }

    onFileSelected(event: { url: string; file: File }): void {
        if (this.isSubmitting()) return;
        this.submissionError.set(null);
        this.draftFiles.register(event);
    }

    async onFormSubmit(formValue: ProductFormData): Promise<void> {
        if (this.isSubmitting() || this.isDestroyed) return;

        const version = this.editorVersion;
        const submission = this.captureSubmission(formValue);
        this.isSubmitting.set(true);
        this.submissionError.set(null);

        try {
            await this.draftFiles.save(submission.assets, assets => this.persistProduct(submission, assets));
            if (!this.isCurrentEditor(version)) return;
            await this.router.navigate(['/seller/profile']);
        } catch (error) {
            if (!(error instanceof DraftSubmissionCancelledError) && this.isCurrentEditor(version)) {
                this.logger.error('Failed to save product', error, 'ProductCreate');
                this.submissionError.set(this.getSubmissionErrorMessage(error));
            }
        } finally {
            if (this.isCurrentEditor(version)) this.isSubmitting.set(false);
        }
    }

    async onCancel(): Promise<void> {
        if (this.isSubmitting()) return;

        this.draftFiles.reset();
        await this.router.navigate(['/seller/profile']);
    }

    private isCurrentEditor(version: number): boolean {
        return !this.isDestroyed && version === this.editorVersion;
    }

    private resetProductData(): void {
        this.editorVersion++;
        this.draftFiles.reset();
        this.isSubmitting.set(false);
        this.formData.set(null);
        this.keywords.set([]);
        this.originalAssets.set([]);
        this.imageAssets.set([]);
        this.model3dGlbAsset.set(null);
        this.model3dUsdzAsset.set(null);
        this.submissionError.set(null);
    }

    private getSubmissionErrorMessage(error: unknown): string {
        if (error instanceof DraftFileUploadError) {
            return `No pudimos subir “${error.fileName}”. Revisa tu conexión e inténtalo nuevamente; tus datos siguen guardados en el formulario.`;
        }

        const appError = toAppError(error, {
            fallbackMessage: 'No pudimos guardar el producto.',
            codeMessages: { PRODUCT_LIMIT_REACHED: 'Alcanzaste el límite de productos permitidos.' },
        });
        return `${appError.message} Tus datos siguen guardados en el formulario.`;
    }

    private captureSubmission(formValue: ProductFormData): ProductSubmission {
        const copyAsset = (asset: CreateProductAsset): CreateProductAsset => ({
            ...asset, metadata: { ...asset.metadata },
        });
        const glb = this.model3dGlbAsset();
        const usdz = this.model3dUsdzAsset();
        return {
            id: this.id(),
            form: { ...formValue },
            keywords: [...this.keywords()],
            assets: {
                images: this.imageAssets().map(copyAsset),
                glb: glb ? copyAsset(glb) : null,
                usdz: usdz ? copyAsset(usdz) : null,
            },
            originalAssets: [...this.originalAssets()],
            hasAssetsChanged: this.hasAssetsChanged(),
        };
    }

    private async persistProduct(submission: ProductSubmission, resolvedAssets: ProductDraftAssets): Promise<void> {
        const allAssets = combineAssets(
            resolvedAssets.images,
            resolvedAssets.glb,
            resolvedAssets.usdz
        );

        if (!submission.id) {
            const dto: CreateProductDto = buildCreateDto(submission.form, submission.keywords, allAssets);
            await firstValueFrom(this.productService.createProduct(dto, PRODUCT_MUTATION_OPTIONS));
            return;
        }

        const updateAssets = submission.hasAssetsChanged
            ? buildAssetsForUpdate(
                resolvedAssets.images,
                resolvedAssets.glb,
                resolvedAssets.usdz,
                submission.originalAssets
            )
            : undefined;

        const dto: UpdateProductDto = buildUpdateDto(submission.form, submission.keywords, updateAssets);
        await firstValueFrom(this.productService.updateProduct(submission.id, dto, PRODUCT_MUTATION_OPTIONS));
    }
}
