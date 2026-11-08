import { HttpClient, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PLATFORM_ID, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { API_ENDPOINTS } from '@core/constants/api-endpoints';
import { ProductSummary } from '@core/models/product/product-summary';
import { LoggerService } from '@core/services/logger/logger';
import { MarketService } from '@core/services/market/market';
import { NewArrivalsStore } from './new-arrivals.store';

const chair: ProductSummary = {
  id: 'chair', title: 'Silla', price: 100, currencyCode: 'BOB', category: null, primaryImage: null,
};

function page(data: ProductSummary[] = []) {
  return { data, total: data.length, page: 1, limit: 4, totalPages: data.length ? 1 : 0 };
}

describe('NewArrivalsStore', () => {
  let market: ReturnType<typeof signal<{ code: string }>>;

  beforeEach(() => {
    market = signal({ code: 'BO' });
    TestBed.configureTestingModule({ providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: MarketService, useValue: { selectedMarket: market.asReadonly() } },
      { provide: LoggerService, useValue: { error: vi.fn() } },
    ] });
  });

  afterEach(() => TestBed.inject(HttpTestingController).verify());

  function createStore() {
    TestBed.inject(HttpClient);
    return TestBed.inject(NewArrivalsStore);
  }

  function expectProducts(marketCode = 'BO') {
    return TestBed.inject(HttpTestingController).expectOne(request =>
      request.url === API_ENDPOINTS.PRODUCTS.BASE
      && request.params.get('page') === '1'
      && request.params.get('limit') === '4'
      && request.params.get('marketCode') === marketCode,
    );
  }

  function expectNoProducts() {
    TestBed.inject(HttpTestingController).expectNone(request =>
      request.url === API_ENDPOINTS.PRODUCTS.BASE,
    );
  }

  it('starts HTTP synchronously and shares an in-flight prefetch with the view', () => {
    const store = createStore();
    store.prefetch();
    const request = expectProducts();
    const release = store.connect();
    TestBed.tick();
    expectNoProducts();
    expect(store.isInitialLoading()).toBe(true);
    request.flush(page([chair]));
    expect(store.products()).toEqual([chair]);
    expect(store.isLoading()).toBe(false);
    release();
  });

  it('hands a completed prefetch to the view without another request', () => {
    const store = createStore();
    store.prefetch();
    expectProducts().flush(page([chair]));
    const release = store.connect();
    TestBed.tick();
    expectNoProducts();
    expect(store.products()).toEqual([chair]);
    expect(store.isInitialLoading()).toBe(false);
    release();
  });

  it('loads normally when home is reached through client navigation', () => {
    const store = createStore();
    expectNoProducts();
    const release = store.connect();
    expectProducts().flush(page([chair]));
    expect(store.products()).toEqual([chair]);
    release();
  });

  it('cancels the previous market request and keeps loading the selected market', () => {
    const store = createStore();
    store.prefetch();
    const previous = expectProducts();
    market.set({ code: 'PE' });
    TestBed.tick();
    expect(previous.cancelled).toBe(true);
    expect(store.products()).toEqual([]);
    expect(store.isLoading()).toBe(true);
    expectProducts('PE').flush(page());
    expect(store.isLoading()).toBe(false);
  });

  it('does not repeat the request when bootstrap confirms the same market code', () => {
    const store = createStore();
    store.prefetch();
    expectProducts().flush(page([chair]));
    market.set({ code: 'BO' });
    TestBed.tick();
    expectNoProducts();
    expect(store.products()).toEqual([chair]);
  });

  it('clears previous market products before requesting the new market', () => {
    const store = createStore();
    const release = store.connect();
    expectProducts().flush(page([chair]));
    market.set({ code: 'PE' });
    TestBed.tick();
    expect(store.products()).toEqual([]);
    expect(store.isInitialLoading()).toBe(true);
    expectProducts('PE').flush(page());
    release();
  });

  it('recovers from an initial failure through the existing retry action', () => {
    const store = createStore();
    const release = store.connect();
    expectProducts().flush({}, { status: 503, statusText: 'Unavailable' });
    expect(store.error()).toBe('No pudimos cargar las novedades. Inténtalo nuevamente.');
    expect(store.isLoading()).toBe(false);
    store.retry();
    expect(store.error()).toBeNull();
    expect(store.isLoading()).toBe(true);
    expectProducts().flush(page([chair]));
    expect(store.products()).toEqual([chair]);
    expect(store.error()).toBeNull();
    release();
  });

  it('cancels work when the view leaves and fetches fresh data on return', () => {
    const store = createStore();
    const release = store.connect();
    const pending = expectProducts();
    release();
    expect(pending.cancelled).toBe(true);
    market.set({ code: 'PE' });
    TestBed.tick();
    expectNoProducts();
    const releaseNext = store.connect();
    expectProducts('PE').flush(page());
    releaseNext();
  });

  it('keeps a request alive while another view consumer uses it', () => {
    const store = createStore();
    const releaseFirst = store.connect();
    const releaseSecond = store.connect();
    const request = expectProducts();
    releaseFirst();
    expect(request.cancelled).toBe(false);
    request.flush(page([chair]));
    expect(store.products()).toEqual([chair]);
    releaseSecond();
  });

  it('ignores a buffered old market when home is reopened before change detection', () => {
    const store = createStore();
    const release = store.connect();
    TestBed.tick();
    expectProducts().flush(page([chair]));
    release();

    market.set({ code: 'PE' });
    const releaseNext = store.connect();
    const request = expectProducts('PE');
    expect(request.cancelled).toBe(false);
    TestBed.tick();
    expectNoProducts();
    request.flush(page());
    releaseNext();
  });

  it('does not request products during server rendering', () => {
    TestBed.overrideProvider(PLATFORM_ID, { useValue: 'server' });
    const store = createStore();
    store.prefetch();
    const release = store.connect();
    TestBed.tick();
    expectNoProducts();
    expect(store.products()).toEqual([]);
    release();
  });
});
