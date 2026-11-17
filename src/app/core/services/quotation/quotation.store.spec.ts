import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_ENDPOINTS } from '@core/constants/api-endpoints';
import { quotationFixture } from '@features/quotations/testing/quotation-fixture';
import { QuotationStore } from './quotation.store';

describe('Route-scoped quotation state', () => {
  let http: HttpTestingController;
  let store: InstanceType<typeof QuotationStore>;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), QuotationStore],
    });
    http = TestBed.inject(HttpTestingController);
    store = TestBed.inject(QuotationStore);
  });
  afterEach(() => http.verify());

  it('cancels an obsolete request and never restores another request’s contact details', () => {
    store.loadOne('first');
    const first = http.expectOne(`${API_ENDPOINTS.QUOTATIONS.BASE}/first`);
    store.loadOne('second');
    expect(first.cancelled).toBe(true);
    http
      .expectOne(`${API_ENDPOINTS.QUOTATIONS.BASE}/second`)
      .flush(quotationFixture({ id: 'second' }));
    expect(store.selected()?.id).toBe('second');
    store.loadOne('private');
    expect(store.selected()).toBeNull();
    http
      .expectOne(`${API_ENDPOINTS.QUOTATIONS.BASE}/private`)
      .flush({}, { status: 404, statusText: 'Not found' });
    expect(store.error()).toBe(true);
    expect(store.selected()).toBeNull();
  });

  it('reloads the active inbox page after a connection failure', () => {
    store.loadList('received', 2);
    http
      .expectOne((r) => r.params.get('view') === 'received' && r.params.get('page') === '2')
      .error(new ProgressEvent('error'));
    store.retry();
    http
      .expectOne((r) => r.params.get('view') === 'received' && r.params.get('page') === '2')
      .flush({ data: [quotationFixture()], total: 21, page: 2, limit: 20, totalPages: 2 });
    expect(store.error()).toBe(false);
    expect(store.list()?.page).toBe(2);
    expect(store.list()?.data.length).toBe(1);
  });
  it('cancels private requests and removes cached data when the session closes', () => {
    store.loadOne('quotation-1');
    const pending = http.expectOne(`${API_ENDPOINTS.QUOTATIONS.BASE}/quotation-1`);
    store.clear();
    expect(pending.cancelled).toBe(true);
    expect(store.selected()).toBeNull();
    expect(store.list()).toBeNull();
    expect(store.loading()).toBe(false);
    store.retry();
    http.expectNone(`${API_ENDPOINTS.QUOTATIONS.BASE}/quotation-1`);
  });
});
