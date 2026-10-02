import { signal, type WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';

import { AuthService } from '@core/auth/services/auth';
import type { AppError } from '@core/models/errors/api-error.model';
import type { Product } from '@core/models/product/product';
import { ProductFormData } from '@core/models/product/product-form.model';
import { CategoryService } from '@core/services/category/category';
import { ImageOptimizerService } from '@core/services/image-optimizer/image-optimizer.service';
import { LoggerService } from '@core/services/logger/logger';
import { ProductStore } from '@core/services/product/product.store';
import { ProductService } from '@core/services/product/product';
import { UploadFileService } from '@core/services/uploadFile/upload-file';
import { ProductCreate } from './product-create';
import { ProductDraftFiles } from './product-draft-files';

describe('ProductCreate', () => {
  let component: ProductCreate;
  let fixture: ComponentFixture<ProductCreate>;
  let uploadFile: ReturnType<typeof vi.fn>;
  let deleteFile: ReturnType<typeof vi.fn>;
  let createProduct: ReturnType<typeof vi.fn>;
  let updateProduct: ReturnType<typeof vi.fn>;
  let compressImage: ReturnType<typeof vi.fn>;
  let draftFiles: ProductDraftFiles;
  let getProductById: ReturnType<typeof vi.fn>;
  let selectedEntity: WritableSignal<Product | null>;
  let isStoreLoading: WritableSignal<boolean>;
  let isStoreError: WritableSignal<boolean>;
  let productError: WritableSignal<AppError | null>;

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
    createProduct = vi.fn().mockReturnValue(throwError(() => ({
        kind: 'unknown',
        message: 'No pudimos crear el producto.',
        status: null,
        code: null,
        retryable: false,
        correlationId: null,
    })));
    updateProduct = vi.fn().mockReturnValue(of({}));
    compressImage = vi.fn((file: File) => Promise.resolve(file));
    selectedEntity = signal<Product | null>(null);
    isStoreLoading = signal(false);
    isStoreError = signal(false);
    productError = signal<AppError | null>(null);
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
          useValue: { compressImage },
        },
        {
          provide: ProductService,
          useValue: { createProduct, updateProduct },
        },
        {
          provide: Router,
          useValue: { navigate: vi.fn().mockResolvedValue(true) },
        },
        {
          provide: LoggerService,
          useValue: { error: vi.fn(), warn: vi.fn() },
        },
      ],
    })
      .overrideComponent(ProductCreate, {
        set: {
          providers: [ProductDraftFiles, {
            provide: ProductStore,
            useValue: {
              selectedEntity: selectedEntity.asReadonly(),
              isLoading: isStoreLoading.asReadonly(),
              isError: isStoreError.asReadonly(),
              error: productError.asReadonly(),
              getProductById,
            },
          }],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ProductCreate);
    component = fixture.componentInstance;
    draftFiles = fixture.debugElement.injector.get(ProductDraftFiles);
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
    productError.set({
      kind: 'network',
      message: 'No pudimos conectarnos al servidor.',
      status: 0,
      code: null,
      retryable: true,
      correlationId: null,
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No pudimos cargar el producto');
    expect(fixture.nativeElement.textContent).toContain('No pudimos conectarnos al servidor.');
    expect(fixture.nativeElement.querySelector('app-product-form')).toBeNull();

    const retryButton = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('button'),
    ).find((button) => button.textContent?.includes('Reintentar'));
    retryButton?.click();
    fixture.detectChanges();

    expect(getProductById).toHaveBeenCalledTimes(2);
    expect(fixture.nativeElement.textContent).toContain('Cargando producto');
  });

  it('does not offer retry for a non-retryable load error', () => {
    fixture.componentRef.setInput('id', 'product-id');
    fixture.detectChanges();

    isStoreLoading.set(false);
    isStoreError.set(true);
    productError.set({
      kind: 'not-found',
      message: 'Producto no encontrado.',
      status: 404,
      code: null,
      retryable: false,
      correlationId: null,
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Producto no encontrado.');
    expect(fixture.nativeElement.textContent).not.toContain('Reintentar');
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

    expect(uploadFile).toHaveBeenCalledWith(file, 'product_image', 'local');
    expect(deleteFile).toHaveBeenCalledWith('products/seller-id/silla.webp');
    expect(component.imageAssets()[0]?.url).toBe(localUrl);
    expect(draftFiles.pendingCount()).toBe(1);
    expect(component.submissionError()).toContain('Tus datos siguen guardados en el formulario.');
    expect(component.isSubmitting()).toBe(false);
  });

  it('waits for image compression before an immediate submission uploads the file', async () => {
    let finishCompression!: (file: File) => void;
    compressImage.mockReturnValue(new Promise<File>(resolve => { finishCompression = resolve; }));
    const file = new File(['original'], 'silla.png', { type: 'image/png' });
    const optimized = new File(['optimized'], 'silla.webp', { type: 'image/webp' });
    component.imageAssets.set([imageAsset('blob:compressing')]);
    component.onFileSelected({ url: 'blob:compressing', file });

    const submission = component.onFormSubmit(validForm);
    expect(uploadFile).not.toHaveBeenCalled();
    expect(createProduct).not.toHaveBeenCalled();
    finishCompression(optimized);
    await submission;

    expect(uploadFile).toHaveBeenCalledWith(optimized, 'product_image', 'local');
  });

  it('captures form data and keywords before asynchronous file preparation', async () => {
    let finishCompression!: (file: File) => void;
    compressImage.mockReturnValue(new Promise<File>(resolve => { finishCompression = resolve; }));
    const file = new File(['image'], 'silla.webp', { type: 'image/webp' });
    const form = { ...validForm };
    const keywords = ['silla'];
    component.keywords.set(keywords);
    component.imageAssets.set([imageAsset('blob:snapshot')]);
    component.onFileSelected({ url: 'blob:snapshot', file });

    const submission = component.onFormSubmit(form);
    form.title = 'Changed during preparation';
    keywords.push('changed');
    component.onKeywordsChange(['ignored during submission']);
    finishCompression(file);
    await submission;

    expect(createProduct).toHaveBeenCalledWith(expect.objectContaining({
      title: validForm.title,
      keywords: ['silla'],
    }), expect.objectContaining({ errorFeedback: 'local' }));
  });

  it('resets pending files and change detection when the route changes to another product', async () => {
    fixture.componentRef.setInput('id', 'first-id');
    fixture.detectChanges();
    const file = new File(['image'], 'draft.webp', { type: 'image/webp' });
    component.imageAssets.set([imageAsset('blob:first-draft')]);
    component.onFileSelected({ url: 'blob:first-draft', file });
    expect(component.hasAssetsChanged()).toBe(true);

    fixture.componentRef.setInput('id', 'second-id');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(draftFiles.pendingCount()).toBe(0);
    expect(component.hasAssetsChanged()).toBe(false);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:first-draft');
  });

  it('does not redirect or delete committed files after the route changes during persistence', async () => {
    const persistence = new Subject<Product>();
    createProduct.mockReturnValue(persistence);
    const navigate = TestBed.inject(Router).navigate;
    component.imageAssets.set([imageAsset('blob:saving')]);
    component.onFileSelected({ url: 'blob:saving', file: new File(['image'], 'silla.webp', { type: 'image/webp' }) });
    const submission = component.onFormSubmit(validForm);
    await vi.waitFor(() => expect(createProduct).toHaveBeenCalledOnce());

    fixture.componentRef.setInput('id', 'next-product');
    fixture.detectChanges();
    expect(deleteFile).not.toHaveBeenCalled();
    persistence.next({ id: 'saved-product' } as Product);
    persistence.complete();
    await submission;

    expect(navigate).not.toHaveBeenCalled();
    expect(deleteFile).not.toHaveBeenCalled();
    expect(component.isSubmitting()).toBe(false);
  });

  it('updates the captured product while retaining existing asset IDs', async () => {
    fixture.componentRef.setInput('id', 'edited-product');
    fixture.detectChanges();
    const existing = {
      id: 'existing-image', productId: 'edited-product', url: 'https://storage.example/existing.webp',
      type: 'image', isPrimary: true, metadata: { alt: 'Existing image' },
    };
    component.originalAssets.set([existing]);
    component.imageAssets.set([
      { ...existing, type: 'image', isPrimary: false },
      imageAsset('blob:new-image'),
    ]);
    component.onFileSelected({ url: 'blob:new-image', file: new File(['image'], 'silla.webp', { type: 'image/webp' }) });

    await component.onFormSubmit(validForm);
    fixture.destroy();

    expect(updateProduct).toHaveBeenCalledWith('edited-product', expect.objectContaining({
      assets: [
        expect.objectContaining({ id: 'existing-image', url: existing.url, isPrimary: false }),
        expect.objectContaining({ url: 'https://storage.example/silla.webp', isPrimary: true }),
      ],
    }), expect.objectContaining({ errorFeedback: 'local' }));
    expect(createProduct).not.toHaveBeenCalled();
    expect(deleteFile).not.toHaveBeenCalled();
  });

  it('preserves the localized product limit error after the persistence refactor', async () => {
    createProduct.mockReturnValue(throwError(() => new HttpErrorResponse({
      status: 409,
      error: { code: 'PRODUCT_LIMIT_REACHED', message: 'Internal limit details' },
    })));

    await component.onFormSubmit(validForm);

    expect(component.submissionError()).toContain('Alcanzaste el límite de productos permitidos.');
    expect(component.submissionError()).not.toContain('Internal limit details');
  });
});

function imageAsset(url: string) {
  return { url, type: 'image' as const, isPrimary: true, metadata: {} };
}
