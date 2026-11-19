import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { AuthService } from '@core/auth/services/auth';
import { API_ENDPOINTS } from '@core/constants/api-endpoints';
import type { User } from '@core/auth/models/auth.models';
import { MarketService } from '@core/services/market/market';
import { productFixture } from '../../testing/product-fixture';
import { quotationFixture } from '@features/quotations/testing/quotation-fixture';
import { DimensionStudio } from './dimension-studio';

describe('Custom-dimension quotation journey', () => {
  const user = signal<User | null>({
    id: 'customer',
    email: 'customer@example.test',
    role: 'consumer',
  });
  let http: HttpTestingController;
  beforeEach(() => {
    user.set({ id: 'customer', email: 'customer@example.test', role: 'consumer' });
    localStorage.removeItem('muvia.language');
    TestBed.configureTestingModule({
      imports: [DimensionStudio],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap({}) } },
        },
        { provide: AuthService, useValue: { currentUser: user } },
        {
          provide: MarketService,
          useValue: { selectedMarket: signal({ code: 'BO' }), locale: signal('es-BO') },
        },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  });
  afterEach(() => http.verify());
  function setup() {
    const fixture = TestBed.createComponent(DimensionStudio);
    const product = productFixture({ acceptsCustomDimensions: true });
    fixture.componentRef.setInput('product', product);
    fixture.detectChanges();
    return { fixture, component: fixture.componentInstance, product };
  }

  it('compares requested dimensions without changing the catalog measurements or reference price', async () => {
    const { fixture, component, product } = setup();
    component.draft.update((draft) => ({ ...draft, width: 160, notes: 'Más ancho' }));
    fixture.detectChanges();
    expect(component.comparisonDimensions().width).toBe(160);
    expect(product.specifications?.dimensions?.width).toBe(140);
    expect(component.referencePrice().amount).toBe(2450);
    await component.review(new Event('submit'));
    fixture.detectChanges();
    expect(component.reviewOpen()).toBe(true);
    expect(document.activeElement?.id).toBe('dimension-studio-title');
    expect(fixture.nativeElement.textContent).toContain('A cotizar');
    expect(fixture.nativeElement.textContent).toContain(user()!.email);
    expect(fixture.nativeElement.querySelector('svg')).toBeNull();
  });

  it('blocks invalid measurements before opening review or submitting anything', async () => {
    const { component, fixture } = setup();
    component.draft.update((draft) => ({ ...draft, width: 0 }));
    await component.review(new Event('submit'));
    fixture.detectChanges();
    expect(component.reviewOpen()).toBe(false);
    expect(component.fields.width().invalid()).toBe(true);
    expect(document.activeElement?.id).toBe('studio-width');
    component.reset();
    expect(component.draft().width).toBe(140);
    expect(component.fields().invalid()).toBe(false);
  });

  it('preserves a draft and request identifier when retrying a failed submission', async () => {
    const { component } = setup();
    component.draft.update((draft) => ({ ...draft, width: 160, notes: 'Más ancho' }));
    await component.review(new Event('submit'));
    const firstAttempt = component.send();
    const failed = http.expectOne(API_ENDPOINTS.QUOTATIONS.BASE);
    const payload = failed.request.body;
    expect(payload).toMatchObject({
      productId: 'desk',
      marketCode: 'BO',
      dimensions: { width: 160, depth: 60, height: 75, unit: 'cm' },
      notes: 'Más ancho',
    });
    expect(payload.publishedPrice).toBeUndefined();
    expect(payload.customerEmail).toBeUndefined();
    failed.flush({}, { status: 503, statusText: 'Unavailable' });
    await firstAttempt;
    expect(component.error()).toBe('quotations.sendFailed');
    expect(component.draft().width).toBe(160);
    const retry = component.send();
    const saved = http.expectOne(API_ENDPOINTS.QUOTATIONS.BASE);
    expect(saved.request.body.requestId).toBe(payload.requestId);
    saved.flush(quotationFixture());
    await retry;
    expect(TestBed.inject(Router).navigate).toHaveBeenCalledWith(['/quotations', 'quotation-1'], {
      queryParams: { created: '1' },
    });
  });

  it('returns an anonymous customer to the chosen dimensions after login', async () => {
    user.set(null);
    const { component } = setup();
    component.draft.update((draft) => ({ ...draft, width: 160 }));
    await component.review(new Event('submit'));
    const navigate = vi.mocked(TestBed.inject(Router).navigate);
    const [, options] = navigate.mock.calls[0];
    expect(options?.queryParams?.['returnUrl']).toContain('width=160');
    expect(options?.queryParams?.['returnUrl']).toContain('quote=1');
    expect(component.reviewOpen()).toBe(false);
  });
  it('removes private comments and closes review when the customer signs out', async () => {
    const { component, fixture } = setup();
    component.draft.update((draft) => ({ ...draft, width: 160, notes: 'Consulta privada' }));
    await component.review(new Event('submit'));
    fixture.detectChanges();
    user.set(null);
    fixture.detectChanges();
    expect(component.reviewOpen()).toBe(false);
    expect(component.draft().notes).toBe('');
    expect(component.draft().width).toBe(160);
    expect(fixture.nativeElement.textContent).not.toContain('Consulta privada');
    expect(fixture.nativeElement.textContent).not.toContain('customer@example.test');
  });
});
