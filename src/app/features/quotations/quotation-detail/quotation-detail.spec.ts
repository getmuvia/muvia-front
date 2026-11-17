import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { AuthService } from '@core/auth/services/auth';
import type { User } from '@core/auth/models/auth.models';
import { API_ENDPOINTS } from '@core/constants/api-endpoints';
import { MarketService } from '@core/services/market/market';
import { quotationFixture } from '../testing/quotation-fixture';
import { QuotationDetail } from './quotation-detail';
import { QuotationResponse } from '../components/quotation-response/quotation-response';

describe('Private quotation detail', () => {
  let http: HttpTestingController;
  const currentUser = signal<User | null>(null);
  beforeEach(() => {
    currentUser.set({ id: 'customer', email: 'customer@example.test', role: 'consumer' });
    localStorage.removeItem('muvia.language');
    TestBed.configureTestingModule({
      imports: [QuotationDetail],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap({}) } },
        },
        {
          provide: AuthService,
          useValue: { currentUser },
        },
        { provide: MarketService, useValue: { locale: signal('es-BO') } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  });
  afterEach(() => http.verify());

  it('shows the persisted seller proposal and acknowledges only that response version', () => {
    const fixture = TestBed.createComponent(QuotationDetail);
    fixture.componentRef.setInput('id', 'quotation-1');
    fixture.detectChanges();
    const respondedAt = '2026-11-16T14:00:00.000Z';
    http.expectOne(`${API_ENDPOINTS.QUOTATIONS.BASE}/quotation-1`).flush(
      quotationFixture({
        status: 'QUOTED',
        quotedPrice: '2850.50',
        leadTimeMinDays: 12,
        leadTimeMaxDays: 18,
        responseMessage: 'Sí podemos realizarlo.',
        respondedAt,
      }),
    );
    fixture.detectChanges();
    const read = http.expectOne(`${API_ENDPOINTS.QUOTATIONS.BASE}/quotation-1/read`);
    expect(read.request.body).toEqual({ respondedAt });
    read.flush(null, { status: 204, statusText: 'No content' });
    expect(fixture.nativeElement.textContent).toContain('Sí podemos realizarlo.');
    expect(fixture.nativeElement.textContent).toContain('12–18 días');
    expect(fixture.nativeElement.textContent).toContain('Cotización recibida');
    expect(fixture.nativeElement.querySelector('app-quotation-response')).toBeNull();
  });

  it('removes the previous customer’s details when the next request is inaccessible', () => {
    const fixture = TestBed.createComponent(QuotationDetail);
    fixture.componentRef.setInput('id', 'quotation-1');
    fixture.detectChanges();
    http.expectOne(`${API_ENDPOINTS.QUOTATIONS.BASE}/quotation-1`).flush(quotationFixture());
    fixture.detectChanges();
    http
      .expectOne(`${API_ENDPOINTS.QUOTATIONS.BASE}/quotation-1/read`)
      .flush(null, { status: 204, statusText: 'No content' });
    fixture.componentRef.setInput('id', 'private');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Escritorio Roble');
    http
      .expectOne(`${API_ENDPOINTS.QUOTATIONS.BASE}/private`)
      .flush({}, { status: 404, statusText: 'Not found' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No pudimos cargar la solicitud');
    expect(fixture.nativeElement.textContent).not.toContain('customer@example.test');
  });
  it('clears the request immediately and leaves the private page after logout', () => {
    const fixture = TestBed.createComponent(QuotationDetail);
    fixture.componentRef.setInput('id', 'quotation-1');
    fixture.detectChanges();
    http.expectOne(`${API_ENDPOINTS.QUOTATIONS.BASE}/quotation-1`).flush(quotationFixture());
    fixture.detectChanges();
    http
      .expectOne(`${API_ENDPOINTS.QUOTATIONS.BASE}/quotation-1/read`)
      .flush(null, { status: 204, statusText: 'No content' });
    currentUser.set(null);
    fixture.detectChanges();
    expect(fixture.componentInstance.store.selected()).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('Escritorio Roble');
    expect(TestBed.inject(Router).navigate).toHaveBeenCalledWith(
      ['/auth/login'],
      expect.objectContaining({ replaceUrl: true }),
    );
  });
  it('preserves a seller’s unsent response when the window regains focus or the profile refreshes', () => {
    currentUser.set({ id: 'seller', email: 'seller@example.test', role: 'vendor' });
    const fixture = TestBed.createComponent(QuotationDetail);
    fixture.componentRef.setInput('id', 'quotation-1');
    fixture.detectChanges();
    http.expectOne(`${API_ENDPOINTS.QUOTATIONS.BASE}/quotation-1`).flush(quotationFixture());
    fixture.detectChanges();
    http
      .expectOne(`${API_ENDPOINTS.QUOTATIONS.BASE}/quotation-1/read`)
      .flush(null, { status: 204, statusText: 'No content' });
    const response = fixture.debugElement.query(By.directive(QuotationResponse))
      .componentInstance as QuotationResponse;
    response.draft.update((draft) => ({
      ...draft,
      price: 2850,
      message: 'Propuesta en preparación',
    }));
    window.dispatchEvent(new Event('focus'));
    currentUser.set({ id: 'seller', email: 'seller-updated@example.test', role: 'vendor' });
    fixture.detectChanges();
    http.expectNone(`${API_ENDPOINTS.QUOTATIONS.BASE}/quotation-1`);
    expect(response.draft().message).toBe('Propuesta en preparación');
    expect(response.draft().price).toBe(2850);
  });
});
