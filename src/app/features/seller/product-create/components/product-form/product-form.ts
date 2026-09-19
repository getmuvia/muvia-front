import { Component, ElementRef, computed, inject, input, linkedSignal, output, signal } from '@angular/core';
import { FieldTree, disabled, form, min, minLength, required, submit, validate } from '@angular/forms/signals';
import { Category } from '@core/models/category/category';
import { ProductFormData, INITIAL_PRODUCT_FORM } from '@core/models/product/product-form.model';
import { CreateProductAsset } from '@core/models/product/create-product.dto';
import { BasicInfoSection } from '../basic-info-section/basic-info-section';
import { SpecificationsSection } from '../specifications-section/specifications-section';
import { KeywordsSection } from '../keywords-section/keywords-section';
import { ImageGalleryUpload } from '../image-gallery-upload/image-gallery-upload';
import { Model3dUpload } from '../model-3d-upload/model-3d-upload';

type ProductFormSection = 'basic' | 'specifications' | 'keywords' | 'media';

interface ProductValidationSummaryItem {
    section: ProductFormSection;
    label: string;
    message: string;
}

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
    styleUrl: './product-form.css'
})
export class ProductForm {
    private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

    // Signal Inputs
    readonly initialData = input<ProductFormData | null>(null);
    readonly categories = input<Category[]>([]);
    readonly isLoadingCategories = input(true);
    readonly hasCategoryLoadError = input(false);
    readonly imageAssets = input<CreateProductAsset[]>([]);
    readonly model3dGlbAsset = input<CreateProductAsset | null>(null);
    readonly model3dUsdzAsset = input<CreateProductAsset | null>(null);
    readonly keywords = input<string[]>([]);
    readonly isSubmitting = input(false);
    readonly isEditMode = input(false);
    readonly submissionError = input<string | null>(null);

    // Signal Outputs
    readonly formSubmit = output<ProductFormData>();
    readonly formCancel = output<void>();
    readonly keywordsChange = output<string[]>();
    readonly imagesChange = output<CreateProductAsset[]>();
    readonly glbAssetChange = output<CreateProductAsset | null>();
    readonly usdzAssetChange = output<CreateProductAsset | null>();
    readonly fileSelected = output<{ url: string; file: File }>();
    readonly formChange = output<void>();

    readonly openSection = signal<ProductFormSection | null>('basic');

    // Local form state
    readonly productModel = linkedSignal<ProductFormData>(() =>
        this.initialData() ?? { ...INITIAL_PRODUCT_FORM }
    );

    readonly basicInfoComplete = computed(() => {
        const product = this.productModel();
        return product.title.trim().length >= 3
            && product.description.trim().length >= 10
            && product.price > 0
            && product.stock >= 0
            && product.categoryId.length > 0;
    });

    readonly specificationsComplete = computed(() => {
        const product = this.productModel();
        return product.weight.trim().length > 0
            && product.material.trim().length > 0
            && product.color.trim().length > 0
            && product.dimensionWidth > 0
            && product.dimensionHeight > 0
            && product.dimensionDepth > 0;
    });

    readonly keywordsComplete = computed(() => this.keywords().length > 0);
    readonly mediaComplete = computed(() => this.imageAssets().length > 0);
    readonly completedSectionCount = computed(() => [
        this.basicInfoComplete(),
        this.specificationsComplete(),
        this.keywordsComplete(),
        this.mediaComplete()
    ].filter(Boolean).length);
    readonly completionPercentage = computed(() => this.completedSectionCount() * 25);

    productForm = form(this.productModel, (path) => {
        required(path.title, { message: 'El título es requerido' });
        minLength(path.title, 3, { message: 'El título debe tener al menos 3 caracteres' });
        validate(path.title, ({ value }) => value().trim().length > 0
            ? null
            : { message: 'El título no puede contener solo espacios', kind: 'error' });

        required(path.description, { message: 'La descripción es requerida' });
        minLength(path.description, 10, { message: 'La descripción debe tener al menos 10 caracteres' });
        validate(path.description, ({ value }) => value().trim().length > 0
            ? null
            : { message: 'La descripción no puede contener solo espacios', kind: 'error' });

        required(path.price, { message: 'El precio es requerido' });
        min(path.price, 0.01, { message: 'El precio debe ser mayor a 0' });

        required(path.stock, { message: 'El stock es requerido' });
        min(path.stock, 0, { message: 'El stock no puede ser negativo' });
        required(path.categoryId, { message: 'Selecciona una categoría' });
        disabled(path.categoryId, {
            when: () => this.isLoadingCategories()
                || this.hasCategoryLoadError()
                || this.categories().length === 0,
        });

        required(path.weight, { message: 'El peso es requerido' });
        required(path.material, { message: 'El material es requerido' });
        required(path.color, { message: 'El color es requerido' });
        validate(path.weight, ({ value }) => value().trim().length > 0
            ? null
            : { message: 'El peso no puede contener solo espacios', kind: 'error' });
        validate(path.material, ({ value }) => value().trim().length > 0
            ? null
            : { message: 'El material no puede contener solo espacios', kind: 'error' });
        validate(path.color, ({ value }) => value().trim().length > 0
            ? null
            : { message: 'El color no puede contener solo espacios', kind: 'error' });

        required(path.dimensionWidth, { message: 'El ancho es requerido' });
        required(path.dimensionHeight, { message: 'El alto es requerido' });
        required(path.dimensionDepth, { message: 'El largo es requerido' });
        min(path.dimensionWidth, 0.01, { message: 'El ancho debe ser mayor a 0' });
        min(path.dimensionHeight, 0.01, { message: 'El alto debe ser mayor a 0' });
        min(path.dimensionDepth, 0.01, { message: 'El largo debe ser mayor a 0' });
    });

    // Validation error signals
    keywordsError = signal<string | null>(null);
    imagesError = signal<string | null>(null);
    readonly showValidationSummary = signal(false);
    readonly validationSummary = computed<ProductValidationSummaryItem[]>(() => {
        if (!this.showValidationSummary()) return [];

        const items: ProductValidationSummaryItem[] = [];
        this.addFieldError(items, 'basic', 'Información básica', [
            this.productForm.title,
            this.productForm.description,
            this.productForm.price,
            this.productForm.stock,
            this.productForm.categoryId,
        ]);
        this.addFieldError(items, 'specifications', 'Especificaciones', [
            this.productForm.dimensionWidth,
            this.productForm.dimensionDepth,
            this.productForm.dimensionHeight,
            this.productForm.weight,
            this.productForm.material,
            this.productForm.color,
        ]);

        if (this.keywordsError()) {
            items.push({
                section: 'keywords',
                label: 'Palabras clave',
                message: this.keywordsError()!,
            });
        }
        if (this.imagesError()) {
            items.push({
                section: 'media',
                label: 'Imágenes y modelos 3D',
                message: this.imagesError()!,
            });
        }

        return items;
    });

    isSectionOpen(section: ProductFormSection): boolean {
        return this.openSection() === section;
    }

    toggleSection(section: ProductFormSection): void {
        this.openSection.update(current => current === section ? null : section);
    }

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

    async onSubmit(event: Event): Promise<void> {
        event.preventDefault();

        this.keywordsError.set(
            this.keywords().length === 0 ? 'Agrega al menos una palabra clave.' : null
        );
        this.imagesError.set(
            this.imageAssets().length === 0 ? 'Agrega al menos una imagen.' : null
        );
        const hasManualErrors = !!this.keywordsError() || !!this.imagesError();

        const formIsValid = await submit(this.productForm, {
            action: async () => {
                if (!hasManualErrors) {
                    this.formSubmit.emit(this.productForm().value());
                }
            },
        });

        if (!formIsValid || hasManualErrors) {
            this.showValidationSummary.set(true);
            const firstError = this.validationSummary()[0];
            if (firstError) this.navigateToSection(firstError.section);
            return;
        }

        this.showValidationSummary.set(false);
    }

    onCancel(): void {
        this.formCancel.emit();
    }

    navigateToSection(section: ProductFormSection): void {
        this.openSection.set(section);
        queueMicrotask(() => {
            const sectionElement = this.host.nativeElement.querySelector<HTMLElement>(
                `[data-form-section="${section}"]`
            );
            const focusTarget = sectionElement?.querySelector<HTMLElement>(
                '[aria-invalid="true"], [data-error-focus], input:not([type="hidden"]), textarea, select'
            );

            sectionElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            focusTarget?.focus({ preventScroll: true });
        });
    }

    hasSectionError(section: ProductFormSection): boolean {
        return this.validationSummary().some(item => item.section === section);
    }

    private addFieldError(
        items: ProductValidationSummaryItem[],
        section: ProductFormSection,
        label: string,
        fields: FieldTree<unknown>[],
    ): void {
        const error = fields
            .flatMap(field => field().errors())
            .find(fieldError => !!fieldError.message);
        if (error) {
            items.push({
                section,
                label,
                message: error.message ?? 'Revisa los campos de esta sección.',
            });
        }
    }
}
