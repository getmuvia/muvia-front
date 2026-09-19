import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { AuthService } from '@core/auth/services/auth';
import { ProductFormData } from '@core/models/product/product-form.model';
import { CategoryService } from '@core/services/category/category';
import { ImageOptimizerService } from '@core/services/image-optimizer/image-optimizer.service';
import { LoggerService } from '@core/services/logger/logger';
import { ProductStore } from '@core/services/product/product.store';
import { UploadFileService } from '@core/services/uploadFile/upload-file';
import { ProductCreate } from './product-create';

describe('ProductCreate upload rollback', () => {
  let component: ProductCreate;
  let fixture: ComponentFixture<ProductCreate>;
  let uploadFile: ReturnType<typeof vi.fn>;
  let deleteFile: ReturnType<typeof vi.fn>;
  let createProduct: ReturnType<typeof vi.fn>;

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
              selectedEntity: signal(null).asReadonly(),
              getProductById: vi.fn(),
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
