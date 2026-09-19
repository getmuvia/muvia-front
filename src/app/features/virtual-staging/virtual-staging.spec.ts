import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { Product } from '@core/models/product/product';
import { ProductService, SearchParams } from '@core/services/product/product';
import { VirtualStagingService } from '@core/services/virtual-staging/virtual-staging';
import { VirtualStaging } from './virtual-staging';

describe('VirtualStaging', () => {
  let component: VirtualStaging;
  let fixture: ComponentFixture<VirtualStaging>;
  let searchProducts: ReturnType<typeof vi.fn>;
  let getQuota: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    searchProducts = vi.fn((params: SearchParams) => {
      const page = params.page ?? 1;
      return of({
        data: [createProduct(`product-page-${page}`)],
        total: 12,
        page,
        limit: params.limit ?? 6,
        totalPages: 2,
      });
    });
    getQuota = vi.fn().mockReturnValue(of({ limit: 10, remaining: 10 }));

    await TestBed.configureTestingModule({
      imports: [VirtualStaging],
      providers: [
        {
          provide: VirtualStagingService,
          useValue: {
            quota: signal({ limit: 10, remaining: 10 }).asReadonly(),
            getQuota,
          },
        },
        {
          provide: ProductService,
          useValue: {
            searchProducts,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(VirtualStaging);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should request and replace server-side product pages', async () => {
    expect(searchProducts).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, limit: 6 }),
      { errorFeedback: 'local' },
    );
    expect(component.products().map(product => product.id)).toEqual(['product-page-1']);

    await component.changeCatalogPage(2);

    expect(searchProducts).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 2, limit: 6 }),
      { errorFeedback: 'local' },
    );
    expect(component.products().map(product => product.id)).toEqual(['product-page-2']);
  });

  it('keeps the current catalog visible when another page fails and retries that page', async () => {
    searchProducts.mockReturnValueOnce(throwError(() => new Error('offline')));

    await component.changeCatalogPage(2);

    expect(component.products().map(product => product.id)).toEqual(['product-page-1']);
    expect(component.catalogErrorMessage()).toBe('No pudimos cargar los productos. Inténtalo nuevamente.');
    expect(component.catalogRequestedPage()).toBe(2);

    searchProducts.mockReturnValueOnce(of({
      data: [createProduct('product-page-2')],
      total: 12,
      page: 2,
      limit: 6,
      totalPages: 2,
    }));
    await component.retryCatalog();

    expect(component.catalogErrorMessage()).toBeNull();
    expect(component.products().map(product => product.id)).toEqual(['product-page-2']);
  });

  it('exposes a recoverable quota error', async () => {
    getQuota.mockReturnValueOnce(throwError(() => new Error('offline')));

    await component.retryQuota();

    expect(component.isQuotaLoading()).toBe(false);
    expect(component.quotaErrorMessage()).toBe(
      'No pudimos consultar tus generaciones disponibles. Inténtalo nuevamente.',
    );

    getQuota.mockReturnValueOnce(of({ limit: 10, remaining: 9 }));
    await component.retryQuota();

    expect(component.quotaErrorMessage()).toBeNull();
  });
});

function createProduct(id: string): Product {
  return {
    id,
    sellerId: 'seller-id',
    categoryId: 'category-id',
    title: `Producto ${id}`,
    description: 'Producto de prueba',
    price: '100',
    stock: 1,
    specifications: {},
    keywords: [],
    createdAt: '2026-09-10T00:00:00.000Z',
    assets: [{
      id: `asset-${id}`,
      productId: id,
      url: 'https://storage.googleapis.com/example/product.webp',
      type: 'image',
      isPrimary: true,
      metadata: {},
    }],
    category: {
      id: 'category-id',
      parentId: null,
      name: 'Muebles',
      description: '',
      imageUrl: '',
      level: 0,
    },
  };
}
