import { signal, type WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { AuthService } from '@core/auth/services/auth';
import type { Product } from '@core/models/product/product';
import { ProductFormData } from '@core/models/product/product-form.model';
import { CategoryService } from '@core/services/category/category';
import { ImageOptimizerService } from '@core/services/image-optimizer/image-optimizer.service';
import { LoggerService } from '@core/services/logger/logger';
import { ProductStore } from '@core/services/product/product.store';
import { UploadFileService } from '@core/services/uploadFile/upload-file';
import { ProductCreate } from './product-create';

describe('ProductCreate', () => {
  let component: ProductCreate;
  let fixture: ComponentFixture<ProductCreate>;
  let uploadFile: ReturnType<typeof vi.fn>;
  let deleteFile: ReturnType<typeof vi.fn>;
  let createProduct: ReturnType<typeof vi.fn>;
  let getProductById: ReturnType<typeof vi.fn>;
  let selectedEntity: WritableSignal<Product | null>;
  let isStoreLoading: WritableSignal<boolean>;
  let isStoreError: WritableSignal<boolean>;
  let productError: WritableSignal<string | null>;

  const validForm: ProductFormData = {
    title: 'Silla Nórdica',
    description: 'Silla de madera para comedor contemporáneo.',
    price: 850,
    stock: 2,
    categoryId: 'category-id',
    weight: '8 kg',
    material: 'Madera',
    color: 'Natural',
    dimensionWidth: 48,
    dimensionHeight: 82,
    dimensionDepth: 52,
    dimensionUnit: 'cm',
  };

  beforeEach(async () => {
    uploadFile = vi.fn().mockReturnValue(of({
      key: 'products/seller-id/silla.webp',
      url: 'https://storage.example/silla.webp',
    }));
    deleteFile = vi.fn().mockReturnValue(of(void 0));
    createProduct = vi.fn((request: { onError?: (message: string) => void }) => {
      request.onError?.('No pudimos crear el producto.');
    });
    selectedEntity = signal<Product | null>(null);
    isStoreLoading = signal(false);
    isStoreError = signal(false);
    productError = signal<string | null>(null);
    getProductById = vi.fn(() => {
      selectedEntity.set(null);
      isStoreLoading.set(true);
      isStoreError.set(false);
      productError.set(null);
    });

    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: vi.fn(),
    });

    await TestBed.configureTestingModule({
      imports: [ProductCreate],
      providers: [
        {
          provide: AuthService,
          useValue: { currentUser: signal({ id: 'seller-id' }).asReadonly() },
        },
        {
          provide: CategoryService,
          useValue: { getCategories: vi.fn().mockReturnValue(of([])) },
        },
        {
          provide: UploadFileService,
          useValue: { uploadFile, deleteFile },
        },
        {
          provide: ImageOptimizerService,
          useValue: { compressImage: vi.fn((file: File) => Promise.resolve(file)) },
        },
        {
          provide: Router,
          useValue: { navigate: vi.fn().mockResolvedValue(true) },
        },
        {
          provide: LoggerService,
          useValue: { error: vi.fn() },
        },
      ],
    })
      .overrideComponent(ProductCreate, {
        set: {
          providers: [{
            provide: ProductStore,
            useValue: {
              selectedEntity: selectedEntity.asReadonly(),
              isLoading: isStoreLoading.asReadonly(),
              isError: isStoreError.asReadonly(),
              error: productError.asReadonly(),
              getProductById,
              createProduct,
              updateProduct: vi.fn(),
            },
          }],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ProductCreate);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('shows a loading state instead of an empty edit form', () => {
    fixture.componentRef.setInput('id', 'product-id');
    fixture.detectChanges();

    expect(getProductById).toHaveBeenCalledWith('product-id');
    expect(fixture.nativeElement.textContent).toContain('Cargando producto');
    expect(fixture.nativeElement.querySelector('app-product-form')).toBeNull();
  });

  it('shows the load error and retries without exposing the form', () => {
    fixture.componentRef.setInput('id', 'product-id');
    fixture.detectChanges();

    isStoreLoading.set(false);
    isStoreError.set(true);
    productError.set('Producto no encontrado.');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No pudimos cargar el producto');
    expect(fixture.nativeElement.textContent).toContain('Producto no encontrado.');
    expect(fixture.nativeElement.querySelector('app-product-form')).toBeNull();

    const retryButton = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('button'),
    ).find((button) => button.textContent?.includes('Reintentar'));
    retryButton?.click();
    fixture.detectChanges();

    expect(getProductById).toHaveBeenCalledTimes(2);
    expect(fixture.nativeElement.textContent).toContain('Cargando producto');
  });

  it('shows the populated form only after the requested product loads', () => {
    fixture.componentRef.setInput('id', 'product-id');
    fixture.detectChanges();

    selectedEntity.set({
      id: 'product-id',
      sellerId: 'seller-id',
      categoryId: 'category-id',
      title: 'Silla Nórdica',
      description: 'Silla de madera para comedor contemporáneo.',
      price: '850.00',
      stock: 2,
      specifications: {},
      keywords: ['silla'],
      createdAt: '2026-09-23T00:00:00.000Z',
      assets: [],
      category: {
        id: 'category-id',
        parentId: null,
        name: 'Sillas',
        description: '',
        imageUrl: '',
        level: 1,
      },
    });
    isStoreLoading.set(false);
    fixture.detectChanges();

    expect(component.formData()?.title).toBe('Silla Nórdica');
    expect(fixture.nativeElement.querySelector('app-product-form')).not.toBeNull();
  });

  it('removes uploaded files and preserves the local form assets after persistence fails', async () => {
    const localUrl = 'blob:local-silla';
    const file = new File(['image'], 'silla.webp', { type: 'image/webp' });
    component.imageAssets.set([{
      url: localUrl,
      type: 'image',
      isPrimary: true,
      metadata: { alt: 'Silla' },
    }]);
    await component.onFileSelected({ url: localUrl, file });

    await component.onFormSubmit(validForm);

    expect(uploadFile).toHaveBeenCalledWith(file, 'products/seller-id', 'local');
    expect(deleteFile).toHaveBeenCalledWith('products/seller-id/silla.webp');
    expect(component.imageAssets()[0]?.url).toBe(localUrl);
    expect(component.pendingUploads().get(localUrl)).toBe(file);
    expect(component.submissionError()).toContain('Tus datos siguen guardados en el formulario.');
    expect(component.isSubmitting()).toBe(false);
  });
});
