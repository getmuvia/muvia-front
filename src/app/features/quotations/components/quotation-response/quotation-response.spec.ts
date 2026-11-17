import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_ENDPOINTS } from '@core/constants/api-endpoints';
import { quotationFixture } from '../../testing/quotation-fixture';
import { QuotationResponse } from './quotation-response';

describe('Seller quotation response', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    localStorage.removeItem('muvia.language');
    TestBed.configureTestingModule({
      imports: [QuotationResponse],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  function setup() {
    const fixture = TestBed.createComponent(QuotationResponse);
    fixture.componentRef.setInput('quotation', quotationFixture());
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  it('prevents a quotation with an invalid production range', async () => {
    const component = setup();
    component.draft.set({
      status: 'QUOTED',
      price: 2850,
      minDays: 20,
      maxDays: 10,
      message: 'Podemos hacerlo.',
    });
    await component.send(new Event('submit'));
    expect(component.fields.maxDays().invalid()).toBe(true);
    expect(component.saving()).toBe(false);
  });

  it('submits the proposed price and production time while preventing duplicate clicks', async () => {
    const component = setup();
    const emitted = vi.spyOn(component.responded, 'emit');
    component.draft.set({
      status: 'QUOTED',
      price: 2850.5,
      minDays: 12,
      maxDays: 18,
      message: 'Podemos hacerlo.',
    });
    const pending = component.send(new Event('submit'));
    await component.send(new Event('submit'));
    const req = http.expectOne(`${API_ENDPOINTS.QUOTATIONS.BASE}/quotation-1/response`);
    expect(req.request.body).toEqual({
      status: 'QUOTED',
      price: 2850.5,
      leadTimeMinDays: 12,
      leadTimeMaxDays: 18,
      message: 'Podemos hacerlo.',
    });
    req.flush(
      quotationFixture({
        status: 'QUOTED',
        quotedPrice: '2850.50',
        leadTimeMinDays: 12,
        leadTimeMaxDays: 18,
      }),
    );
    await pending;
    expect(emitted).toHaveBeenCalledOnce();
  });

  it('allows a decline with a reason without requiring a price or production time', async () => {
    const component = setup();
    component.draft.set({
      status: 'DECLINED',
      price: 0,
      minDays: 0,
      maxDays: 0,
      message: 'No fabricamos ese ancho.',
    });
    const pending = component.send(new Event('submit'));
    const req = http.expectOne(`${API_ENDPOINTS.QUOTATIONS.BASE}/quotation-1/response`);
    expect(req.request.body).toEqual({ status: 'DECLINED', message: 'No fabricamos ese ancho.' });
    req.flush(quotationFixture({ status: 'DECLINED' }));
    await pending;
  });
});
