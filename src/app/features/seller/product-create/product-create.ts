import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductService } from '@core/services/product/product';
import { CategoryService } from '@core/services/category/category';
import { Category } from '@core/models/category/category';
import { CreateProductDto, CreateProductSpecifications, CreateProductAsset } from '@core/models/product/create-product.dto';
import { BasicInfoSection } from './components/basic-info-section/basic-info-section';
import { SpecificationsSection } from './components/specifications-section/specifications-section';
import { KeywordsSection } from './components/keywords-section/keywords-section';
import { ImageGalleryUpload } from './components/image-gallery-upload/image-gallery-upload';
import { Model3dUpload } from './components/model-3d-upload/model-3d-upload';

@Component({
    selector: 'app-product-create',
    imports: [
        ReactiveFormsModule,
        BasicInfoSection,
        SpecificationsSection,
        KeywordsSection,
        ImageGalleryUpload,
        Model3dUpload
    ],
    templateUrl: './product-create.html',
    styleUrl: './product-create.css',
})
export class ProductCreate implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly router = inject(Router);
    private readonly productService = inject(ProductService);
    private readonly categoryService = inject(CategoryService);

    categories = signal<Category[]>([]);
    keywords = signal<string[]>([]);
    imageAssets = signal<CreateProductAsset[]>([]);
    model3dAsset = signal<CreateProductAsset | null>(null);
    isSubmitting = signal(false);
    isLoadingCategories = signal(true);

    productForm: FormGroup = this.fb.group({
        title: ['', [Validators.required, Validators.minLength(3)]],
        description: ['', [Validators.required, Validators.minLength(10)]],
        price: [0, [Validators.required, Validators.min(0.01)]],
        stock: [1, [Validators.required, Validators.min(0)]],
        categoryId: ['', Validators.required],
        specifications: this.fb.group({
            weight: [''],
            material: [''],
            color: [''],
            dimensions: this.fb.group({
                width: [0],
                height: [0],
                depth: [0],
                unit: ['cm']
            })
        })
    });

    ngOnInit(): void {
        this.loadCategories();
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

    onKeywordsChange(keywords: string[]): void {
        this.keywords.set(keywords);
    }

    onImagesChange(assets: CreateProductAsset[]): void {
        this.imageAssets.set(assets);
    }

    onModel3dChange(asset: CreateProductAsset | null): void {
        this.model3dAsset.set(asset);
    }

    onPublish(): void {
        if (this.productForm.invalid) {
            this.productForm.markAllAsTouched();
            return;
        }

        this.submitProduct();
    }

    onSaveDraft(): void {
        // TODO: Implement draft saving logic
        console.log('Saving draft...', this.buildProductDto());
    }

    private submitProduct(): void {
        this.isSubmitting.set(true);
        const dto = this.buildProductDto();

        this.productService.createProduct(dto).subscribe({
            next: (product) => {
                console.log('Product created:', product);
                this.isSubmitting.set(false);
                this.router.navigate(['/seller/profile']);
            },
            error: (err) => {
                console.error('Error creating product:', err);
                this.isSubmitting.set(false);
            }
        });
    }

    private buildProductDto(): CreateProductDto {
        const formValue = this.productForm.value;
        const specs: CreateProductSpecifications = {
            weight: formValue.specifications.weight || undefined,
            material: formValue.specifications.material || undefined,
            color: formValue.specifications.color || undefined,
        };

        // Only add dimensions if any value is set
        const dims = formValue.specifications.dimensions;
        if (dims.width || dims.height || dims.depth) {
            specs.dimensions = {
                width: dims.width || 0,
                height: dims.height || 0,
                depth: dims.depth || 0,
                unit: dims.unit || 'cm'
            };
        }

        // Combine all assets
        const allAssets: CreateProductAsset[] = [...this.imageAssets()];
        const model3d = this.model3dAsset();
        if (model3d) {
            allAssets.push(model3d);
        }

        return {
            title: formValue.title,
            description: formValue.description,
            price: parseFloat(formValue.price),
            stock: parseInt(formValue.stock, 10),
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
