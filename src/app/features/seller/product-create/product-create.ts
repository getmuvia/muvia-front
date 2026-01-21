import { Component, inject, signal, afterNextRender } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { form, required, minLength, submit, validate } from '@angular/forms/signals';
import { ProductStore } from '@core/services/product/product.store';
import { CategoryService } from '@core/services/category/category';
import { UploadFileService } from '@core/services/uploadFile/upload-file';
import { AuthService } from '@core/auth/services/auth';
import { firstValueFrom } from 'rxjs';
import { Category } from '@core/models/category/category';
import { ProductFormData, INITIAL_PRODUCT_FORM } from '@core/models/product/product-form.model';
import { CreateProductDto, CreateProductSpecifications, CreateProductAsset } from '@core/models/product/create-product.dto';
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
    private readonly router = inject(Router);
    private readonly productStore = inject(ProductStore);
    private readonly categoryService = inject(CategoryService);
    private readonly uploadService = inject(UploadFileService);
    private readonly auth = inject(AuthService);

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

    keywordsError = signal<string | null>(null);
    imagesError = signal<string | null>(null);

    constructor() {
        afterNextRender(() => {
            this.loadCategories();
        });
    }

    private loadCategories(): void {
        this.isLoadingCategories.set(true);
        this.categoryService.getCategories().subscribe({
            next: (categories) => {
                this.categories.set(categories);
                this.isLoadingCategories.set(false);
            },
            error: (error: HttpErrorResponse) => {
                console.error('Error loading categories:', error);
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

    onFileSelected(event: { url: string; file: File }): void {
        this.pendingUploads.set(event.url, event.file);
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
        console.log('Saving draft...', this.buildProductDto());
    }

    private async submitProduct(): Promise<void> {
        this.isSubmitting.set(true);

        try {
            await this.uploadPendingFiles();
            const dto = this.buildProductDto();

            return new Promise((resolve) => {
                this.productStore.createProduct({
                    dto,
                    onSuccess: () => {
                        console.log('Product created successfully');
                        this.isSubmitting.set(false);
                        this.router.navigate(['/seller/profile']);
                        resolve();
                    },
                    onError: (err) => {
                        console.error('Error creating product:', err);
                        this.isSubmitting.set(false);
                        resolve();
                    }
                });
            });
        } catch (error) {
            console.error('Error uploading files:', error);
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

    private buildProductDto(): CreateProductDto {
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

    onCancel(): void {
        this.router.navigate(['/seller/profile']);
    }
}
