import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, TestRequest, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { convertToParamMap } from '@angular/router';
import { BehaviorSubject, map } from 'rxjs';
import { API_ENDPOINTS } from '@core/constants/api-endpoints';
import { HTTP_ERROR_FEEDBACK } from '@core/models/errors/http-error-feedback';
import { ProductSummary } from '@core/models/product/product-summary';
import { MarketService } from '@core/services/market/market';
import { ProductCatalog } from './product-catalog';
import { parseProductListFilters } from './product-list-filters';

describe('ProductCatalog request coordination', () => {
  let catalog: ProductCatalog;
  let http: HttpTestingController;
  let initialRequest: TestRequest;
  let params: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  const selectedMarket = signal({ code: 'BO' });
  const locale = signal('es-BO');
  const categories = [{
    id: 'desk-id', code: 'DESK', name: 'Escritorios', parentId: null,
    description: '', imageUrl: '', level: 1, isSelectable: true,
  }];
  const product = (id: string): ProductSummary => ({
    id, title: id, price: 100, currencyCode: 'BOB', category: null, primaryImage: null,
  });
  const catalogRequest = () => http.expectOne(req => req.url === API_ENDPOINTS.PRODUCTS.BASE);
  const hybridRequest = () => http.expectOne(API_ENDPOINTS.AI.HYBRID_SEARCH);
  const categoryRequest = () => http.expectOne(req => req.url === API_ENDPOINTS.CATEGORIES.SELECTABLE);
  const flushPage = (request: TestRequest, page: number, ids: string[], totalPages = 2) => {
    request.flush({ data: ids.map(product), page, total: 20, limit: 10, totalPages });
  };
  const flushHybrid = (request: TestRequest, id: string) => {
    request.flush({
      query: request.request.body.query,
      interpretation: { summary: 'Escritorio · Madera', source: 'ai' },
      results: [{
        id, title: id, description: null, price: 100, currencyCode: 'BOB',
        imageUrl: null, score: 0.8, matchType: 'hybrid',
      }],
      count: 1,
    });
  };

  beforeEach(() => {
    selectedMarket.set({ code: 'BO' });
    locale.set('es-BO');
    TestBed.configureTestingModule({
      providers: [
        ProductCatalog, provideHttpClient(), provideHttpClientTesting(),
        { provide: MarketService, useValue: { selectedMarket, locale } },
      ],
    });
    catalog = TestBed.inject(ProductCatalog);
    http = TestBed.inject(HttpTestingController);
    params = new BehaviorSubject(convertToParamMap({}));
    catalog.connect(params.pipe(map(parseProductListFilters)));
    TestBed.tick();
    categoryRequest().flush(categories);
    initialRequest = catalogRequest();
  });

  afterEach(() => http.verify());

  it('cancels a normal request when switching to smart search', () => {
    params.next(convertToParamMap({ search: 'escritorio de madera' }));
    expect(initialRequest.cancelled).toBe(true);
    expect(catalog.displayLoading()).toBe(true);
    flushHybrid(hybridRequest(), 'smart-result');
    expect(catalog.displayProducts().map(item => item.id)).toEqual(['smart-result']);
    expect(catalog.interpretation()?.summary).toBe('Escritorio · Madera');
    expect(catalog.displayLoading()).toBe(false);
    expect(catalog.hasNextPage()).toBe(false);
  });

  it('cancels a smart request when returning to normal search', () => {
    params.next(convertToParamMap({ search: 'escritorio' }));
    const smart = hybridRequest();
    params.next(convertToParamMap({ category: 'DESK' }));
    expect(smart.cancelled).toBe(true);
    expect(catalog.displayLoading()).toBe(true);
    expect(catalog.interpretation()).toBeNull();
    const normal = catalogRequest();
    expect(normal.request.params.get('categoryId')).toBe('desk-id');
    flushPage(normal, 1, ['filtered-result']);
    expect(catalog.displayProducts().map(item => item.id)).toEqual(['filtered-result']);
  });

  it('cancels the previous smart query without clearing the current loading state', () => {
    params.next(convertToParamMap({ search: 'escritorio' }));
    const previous = hybridRequest();
    params.next(convertToParamMap({ search: 'silla' }));
    expect(previous.cancelled).toBe(true);
    expect(catalog.displayLoading()).toBe(true);
    flushHybrid(hybridRequest(), 'current-result');
    expect(catalog.displayProducts().map(item => item.id)).toEqual(['current-result']);
  });

  it('cancels a pending page when switching modes and clears the previous catalog', () => {
    flushPage(initialRequest, 1, ['page-one']);
    catalog.loadMore();
    const pageTwo = catalogRequest();
    expect(catalog.isLoadingMore()).toBe(true);
    params.next(convertToParamMap({ search: 'escritorio' }));
    expect(pageTwo.cancelled).toBe(true);
    expect(catalog.displayProducts()).toEqual([]);
    flushHybrid(hybridRequest(), 'smart-result');
    expect(catalog.displayProducts().map(item => item.id)).toEqual(['smart-result']);
  });

  it('retains loaded products and retries the exact failed page once', () => {
    flushPage(initialRequest, 1, ['page-one']);
    catalog.loadMore();
    catalog.loadMore();
    const pageTwo = catalogRequest();
    expect(pageTwo.request.params.get('page')).toBe('2');
    expect(pageTwo.request.context.get(HTTP_ERROR_FEEDBACK)).toBe('local');
    pageTwo.flush({ message: 'Internal database error' }, { status: 500, statusText: 'Server Error' });
    expect(catalog.displayProducts().map(item => item.id)).toEqual(['page-one']);
    expect(catalog.displayError()).not.toContain('Internal database');
    expect(catalog.canRetryDisplayError()).toBe(true);
    catalog.retryProducts();
    catalog.retryProducts();
    const retry = catalogRequest();
    expect(retry.request.params.get('page')).toBe('2');
    flushPage(retry, 2, ['page-two']);
    expect(catalog.displayProducts().map(item => item.id)).toEqual(['page-one', 'page-two']);
    expect(catalog.hasNextPage()).toBe(false);
    catalog.loadMore();
    http.expectNone(req => req.url === API_ENDPOINTS.PRODUCTS.BASE);
  });

  it('retries a failed first page without dropping the current filters', () => {
    params.next(convertToParamMap({ category: 'DESK', search: 'madera', dimension: 'width', maxDimensionCm: '120' }));
    const request = catalogRequest();
    request.flush({}, { status: 503, statusText: 'Unavailable' });
    catalog.retryProducts();
    const retry = catalogRequest();
    expect(retry.request.params.get('page')).toBe('1');
    expect(retry.request.params.get('categoryId')).toBe('desk-id');
    expect(retry.request.params.get('search')).toBe('madera');
    expect(retry.request.params.get('dimension')).toBe('width');
    expect(retry.request.params.get('maxDimensionCm')).toBe('120');
    flushPage(retry, 1, ['retry-result']);
    expect(catalog.displayError()).toBeNull();
  });

  it('ignores unrelated URL changes and equivalent normalized filters', () => {
    flushPage(initialRequest, 1, ['initial']);
    params.next(convertToParamMap({ table: '3', search: ' a ' }));
    http.expectNone(req => req.url === API_ENDPOINTS.PRODUCTS.BASE);
    params.next(convertToParamMap({ category: ' desk ' }));
    flushPage(catalogRequest(), 1, ['desk']);
    params.next(convertToParamMap({ category: 'DESK', table: '4' }));
    http.expectNone(req => req.url === API_ENDPOINTS.PRODUCTS.BASE);
  });

  it('cancels old-market products before waiting for current-market categories', () => {
    params.next(convertToParamMap({ category: 'DESK' }));
    const previous = catalogRequest();
    selectedMarket.set({ code: 'PE' });
    locale.set('es-PE');
    TestBed.tick();
    expect(previous.cancelled).toBe(true);
    expect(catalog.displayLoading()).toBe(true);
    expect(catalog.displayProducts()).toEqual([]);
    http.expectNone(req => req.url === API_ENDPOINTS.PRODUCTS.BASE);
    categoryRequest().flush([{ ...categories[0], id: 'peru-desk' }]);
    const current = catalogRequest();
    expect(current.request.params.get('marketCode')).toBe('PE');
    expect(current.request.params.get('categoryId')).toBe('peru-desk');
    flushPage(current, 1, ['peru-result']);
  });

  it('restarts smart search with the new market and locale', () => {
    params.next(convertToParamMap({ search: 'escritorio' }));
    const previous = hybridRequest();
    selectedMarket.set({ code: 'PE' });
    locale.set('es-PE');
    TestBed.tick();
    expect(previous.cancelled).toBe(true);
    categoryRequest().flush(categories);
    const current = hybridRequest();
    expect(current.request.body).toEqual({ query: 'escritorio', limit: 20, marketCode: 'PE', locale: 'es-PE' });
    flushHybrid(current, 'peru-result');
  });

  it('clears old interpretations and related suggestions when starting a different query', () => {
    params.next(convertToParamMap({ search: 'escritorio' }));
    hybridRequest().flush({
      query: 'escritorio', interpretation: { summary: 'Escritorio', source: 'ai' }, results: [], count: 0,
      relatedResults: [{
        id: 'related', title: 'Silla', description: null, price: 100, currencyCode: 'BOB',
        imageUrl: null, score: 0.4, matchType: 'lexical',
      }],
    });
    expect(catalog.relatedProducts()).toHaveLength(1);
    params.next(convertToParamMap({ search: 'silla' }));
    expect(catalog.relatedProducts()).toEqual([]);
    expect(catalog.interpretation()).toBeNull();
    flushHybrid(hybridRequest(), 'chair');
  });

  it('retries a failed smart query without leaking technical error details', () => {
    params.next(convertToParamMap({ search: 'escritorio' }));
    const request = hybridRequest();
    expect(request.request.context.get(HTTP_ERROR_FEEDBACK)).toBe('local');
    request.flush({ message: 'Internal embedding error' }, { status: 500, statusText: 'Server Error' });
    expect(catalog.displayLoading()).toBe(false);
    expect(catalog.displayError()).toBe('No pudimos completar la búsqueda. Inténtalo de nuevo.');
    catalog.retryProducts();
    const retry = hybridRequest();
    expect(retry.request.body.query).toBe('escritorio');
    flushHybrid(retry, 'retry-result');
    expect(catalog.displayError()).toBeNull();
    expect(catalog.displayProducts().map(item => item.id)).toEqual(['retry-result']);
  });

  it('does not retry a non-retryable normal-search error', () => {
    initialRequest.flush({ message: 'Forbidden details' }, { status: 403, statusText: 'Forbidden' });
    expect(catalog.canRetryDisplayError()).toBe(false);
    catalog.retryProducts();
    http.expectNone(req => req.url === API_ENDPOINTS.PRODUCTS.BASE);
  });

  it('keeps summary prices and currencies for primary and related smart-search results', () => {
    params.next(convertToParamMap({ search: 'escritorio' }));
    const result = {
      id: 'primary', title: 'Escritorio', description: null, price: 35.5, currencyCode: 'USD',
      imageUrl: 'https://example.com/desk.webp', score: 0.8, matchType: 'hybrid',
    };
    hybridRequest().flush({
      query: 'escritorio', interpretation: { summary: 'Escritorio', source: 'ai' },
      results: [result], count: 1,
      relatedResults: [{ ...result, id: 'related', price: 180.5, currencyCode: 'PEN', imageUrl: null }],
    });
    expect(catalog.displayProducts()[0]).toMatchObject({
      price: 35.5, currencyCode: 'USD', category: null,
      primaryImage: { url: 'https://example.com/desk.webp', alt: null }, score: 0.8,
    });
    expect(catalog.relatedProducts()[0]).toMatchObject({
      price: 180.5, currencyCode: 'PEN', category: null, primaryImage: null, score: 0.8,
    });
    expect(catalog.displayProducts()[0]).not.toHaveProperty('stock');
    expect(catalog.relatedProducts()[0]).not.toHaveProperty('assets');
  });

  it('cancels active HTTP requests when the catalog is destroyed', () => {
    TestBed.resetTestingModule();
    expect(initialRequest.cancelled).toBe(true);
  });
});
