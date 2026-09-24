import { signal, type WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import type { Product } from '@core/models/product/product';
import { ProductStore } from '@core/services/product/product.store';
import type { AppError } from '@core/models/errors/api-error.model';
import { ProductDetail } from './product-detail';

describe('ProductDetail', () => {
  let component: ProductDetail;
  let fixture: ComponentFixture<ProductDetail>;
  let getProductById: ReturnType<typeof vi.fn>;
  let getAllProducts: ReturnType<typeof vi.fn>;
  let errorState: WritableSignal<AppError | null>;
  let selectedProduct: WritableSignal<Product | null>;

  beforeEach(async () => {
    getProductById = vi.fn();
    getAllProducts = vi.fn().mockReturnValue(of({
      data: [],
      total: 0,
      page: 1,
      limit: 5,
      totalPages: 0,
    }));
    errorState = signal<AppError | null>(null);
    selectedProduct = signal<Product | null>(null);

    await TestBed.configureTestingModule({
      imports: [ProductDetail]
    })
    .overrideComponent(ProductDetail, {
      set: {
        providers: [{
          provide: ProductStore,
          useValue: {
            selectedEntity: selectedProduct.asReadonly(),
            isLoading: signal(false).asReadonly(),
            error: errorState.asReadonly(),
            getProductById,
            getAllProducts,
          },
        }]
      }
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductDetail);
    fixture.componentRef.setInput('id', 'product-id');
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('allows retrying the current product after an error', () => {
    getProductById.mockClear();
    errorState.set({
      kind: 'network',
      message: 'No pudimos cargar el producto.',
      status: 0,
      code: null,
      retryable: true,
      correlationId: null,
    });
    fixture.detectChanges();

    component.retryProduct();

    expect(getProductById).toHaveBeenCalledWith('product-id');
    expect(fixture.nativeElement.textContent).toContain('Reintentar');
  });

  it('loads a bounded category page and clears stale recommendations on failure', () => {
    const relatedProduct = { id: 'related-id', categoryId: 'category-id' } as Product;
    getAllProducts.mockReturnValueOnce(of({
      data: [relatedProduct],
      total: 1,
      page: 1,
      limit: 5,
      totalPages: 1,
    }));

    component.loadSimilarProducts('category-id', 'product-id');

    expect(getAllProducts).toHaveBeenCalledWith({
      page: 1,
      limit: 5,
      search: '',
      categoryId: 'category-id',
    });
    expect(component.similarProducts()).toEqual([relatedProduct]);

    getAllProducts.mockReturnValueOnce(throwError(() => new Error('catalog unavailable')));
    component.loadSimilarProducts('next-category-id', 'next-id');

    expect(component.similarProducts()).toEqual([]);
  });
});
