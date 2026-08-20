import { Component, signal, linkedSignal, input, output, ChangeDetectionStrategy } from '@angular/core';
import { form, required, minLength, submit, validate } from '@angular/forms/signals';
import { Category } from '@core/models/category/category';
import { ProductFormData, INITIAL_PRODUCT_FORM } from '@core/models/product/product-form.model';
import { CreateProductAsset } from '@core/models/product/create-product.dto';
import { BasicInfoSection } from '../basic-info-section/basic-info-section';
import { SpecificationsSection } from '../specifications-section/specifications-section';
import { KeywordsSection } from '../keywords-section/keywords-section';
import { ImageGalleryUpload } from '../image-gallery-upload/image-gallery-upload';
import { Model3dUpload } from '../model-3d-upload/model-3d-upload';

/**
 * Standalone form component for product creation/editing.
 * Uses signal-based inputs and outputs for modern Angular patterns.
 */
@Component({
    selector: 'app-product-form',
    imports: [
        BasicInfoSection,
        SpecificationsSection,
        KeywordsSection,
        ImageGalleryUpload,
        Model3dUpload
    ],
    templateUrl: './product-form.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    styleUrl: './product-form.css'
})
export class ProductForm {

    // Signal Inputs
    readonly initialData = input<ProductFormData | null>(null);
    readonly categories = input<Category[]>([]);
    readonly isLoadingCategories = input(true);
    readonly imageAssets = input<CreateProductAsset[]>([]);
    readonly model3dGlbAsset = input<CreateProductAsset | null>(null);
    readonly model3dUsdzAsset = input<CreateProductAsset | null>(null);
    readonly keywords = input<string[]>([]);
    readonly isSubmitting = input(false);
    readonly isEditMode = input(false);

    // Signal Outputs
    readonly formSubmit = output<ProductFormData>();
    readonly formCancel = output<void>();
    readonly keywordsChange = output<string[]>();
    readonly imagesChange = output<CreateProductAsset[]>();
    readonly glbAssetChange = output<CreateProductAsset | null>();
    readonly usdzAssetChange = output<CreateProductAsset | null>();
    readonly fileSelected = output<{ url: string; file: File }>();
    readonly saveDraft = output<ProductFormData>();

    // Local form state
    readonly productModel = linkedSignal<ProductFormData>(() =>
        this.initialData() ?? { ...INITIAL_PRODUCT_FORM }
    );

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

        required(path.weight, { message: 'El peso es requerido' });
        required(path.material, { message: 'El material es requerido' });
        required(path.color, { message: 'El color es requerido' });

        required(path.dimensionWidth, { message: 'El ancho es requerido' });
        required(path.dimensionHeight, { message: 'El alto es requerido' });
        required(path.dimensionDepth, { message: 'El largo es requerido' });
    });

    // Validation error signals
    keywordsError = signal<string | null>(null);
    imagesError = signal<string | null>(null);

    isFieldInvalid(fieldName: keyof ProductFormData): boolean {
        const fieldSignal = this.productForm[fieldName];
        if (!fieldSignal) return false;

        const field = fieldSignal();
        return field && field.touched() && field.errors().length > 0;
    }

    onKeywordsChange(keywords: string[]): void {
        this.keywordsChange.emit(keywords);
        this.keywordsError.set(null);
    }

    onImagesChange(assets: CreateProductAsset[]): void {
        this.imagesChange.emit(assets);
        this.imagesError.set(null);
    }

    onGlbAssetChange(asset: CreateProductAsset | null): void {
        this.glbAssetChange.emit(asset);
    }

    onUsdzAssetChange(asset: CreateProductAsset | null): void {
        this.usdzAssetChange.emit(asset);
    }

    onFileSelected(event: { url: string; file: File }): void {
        this.fileSelected.emit(event);
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
            this.formSubmit.emit(this.productForm().value());
        });
    }

    onSaveDraft(): void {
        this.saveDraft.emit(this.productForm().value());
    }

    onCancel(): void {
        this.formCancel.emit();
    }
}
