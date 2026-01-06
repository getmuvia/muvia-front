import { Component, inject, signal, afterNextRender } from '@angular/core';
import { Router } from '@angular/router';
import { form, required, minLength, submit, validate } from '@angular/forms/signals';
import { ProductService } from '@core/services/product/product';
import { CategoryService } from '@core/services/category/category';
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
})
export class ProductCreate {
    private readonly router = inject(Router);
    private readonly productService = inject(ProductService);
    private readonly categoryService = inject(CategoryService);

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
    model3dAsset = signal<CreateProductAsset | null>(null);
    isSubmitting = signal(false);
    isLoadingCategories = signal(true);

    // Error messages for non-form fields
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
            error: (err) => {
                console.error('Error loading categories:', err);
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

    onModel3dChange(asset: CreateProductAsset | null): void {
        this.model3dAsset.set(asset);
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
        const dto = this.buildProductDto();

        return new Promise((resolve) => {
            this.productService.createProduct(dto).subscribe({
                next: (product) => {
                    console.log('Product created:', product);
                    this.isSubmitting.set(false);
                    this.router.navigate(['/seller/profile']);
                    resolve();
                },
                error: (err) => {
                    console.error('Error creating product:', err);
                    this.isSubmitting.set(false);
                    resolve();
                }
            });
        });
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
        const model3d = this.model3dAsset();
        if (model3d) {
            allAssets.push(model3d);
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
