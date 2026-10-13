import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { API_ENDPOINTS } from '@core/constants/api-endpoints';
import {
  HTTP_ERROR_FEEDBACK,
  HTTP_ERROR_TELEMETRY,
} from '@core/models/errors/http-error-feedback';
import { MarketService } from '@core/services/market/market';
import { ProductService } from './product';
import { ProductCondition } from '@core/models/product/product-condition';

describe('ProductService error feedback ownership', () => {
  let service: ProductService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: MarketService,
          useValue: {
            selectedMarket: signal({ code: 'BO' }).asReadonly(),
          },
        },
      ],
    });

    service = TestBed.inject(ProductService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('marks catalog requests as locally handled when requested by the screen', () => {
    service.searchProducts(
      { search: '', page: 1, limit: 20 },
      { errorFeedback: 'local', errorTelemetry: { expectedStatuses: [400, 422] } },
    ).subscribe();

    const request = httpTesting.expectOne(req => req.url === API_ENDPOINTS.PRODUCTS.BASE);
    expect(request.request.context.get(HTTP_ERROR_FEEDBACK)).toBe('local');
    expect(request.request.context.get(HTTP_ERROR_TELEMETRY)).toEqual({
      expectedStatuses: [400, 422],
    });
    request.flush({ data: [], total: 0, page: 1, limit: 20, totalPages: 0 });
  });

  it('keeps global feedback as the default for mutations', () => {
    service.createProduct({
      condition: ProductCondition.NEW,
      title: 'Silla',
      description: 'Silla de prueba',
      price: 100,
      stock: 1,
      categoryId: 'category-id',
      assets: [],
      specifications: {},
      keywords: [],
    }).subscribe();

    const request = httpTesting.expectOne(API_ENDPOINTS.PRODUCTS.BASE);
    expect(request.request.context.get(HTTP_ERROR_FEEDBACK)).toBe('global');
    request.flush({});
  });

  it('scopes a public store catalog by seller, page and market', () => {
    service.searchProducts({
      search: '', sellerId: 'store-one', page: 2, limit: 10, marketCode: 'PE',
    }, { errorFeedback: 'local' }).subscribe();

    const request = httpTesting.expectOne(req => req.url === API_ENDPOINTS.PRODUCTS.BASE);
    expect(request.request.params.get('sellerId')).toBe('store-one');
    expect(request.request.params.get('page')).toBe('2');
    expect(request.request.params.get('limit')).toBe('10');
    expect(request.request.params.get('marketCode')).toBe('PE');
    expect(request.request.context.get(HTTP_ERROR_FEEDBACK)).toBe('local');
    request.flush({ data: [], total: 0, page: 2, limit: 10, totalPages: 0 });
  });
});
