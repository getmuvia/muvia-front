import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MarketService } from '@core/services/market/market';
import { I18nService } from '@core/services/i18n/i18n';
import { ProductAvailabilityMode as Mode } from '@core/models/product/product-availability';
import { ProductAvailability } from './product-availability';

describe('Product availability presentation', () => {
  const selectedMarket = signal({ code: 'BO' });
  const summary = {
    id: 'desk',
    title: 'Desk',
    price: 900,
    currencyCode: 'BOB',
    category: null,
    primaryImage: null,
    stock: 0,
  };
  beforeEach(() => {
    localStorage.removeItem('muvia.language');
    TestBed.configureTestingModule({
      imports: [ProductAvailability],
      providers: [{ provide: MarketService, useValue: { selectedMarket } }],
    });
  });
  afterEach(() => localStorage.removeItem('muvia.language'));

  it('does not convert zero stock into made to order', () => {
    const fixture = TestBed.createComponent(ProductAvailability);
    fixture.componentRef.setInput('product', summary);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Sin stock');
    expect(fixture.nativeElement.textContent).not.toContain('Por pedido');
  });
  it('shows explicit order mode, production range and independent customization', () => {
    const fixture = TestBed.createComponent(ProductAvailability);
    fixture.componentRef.setInput('product', {
      ...summary,
      availabilityMode: Mode.MADE_TO_ORDER,
      leadTimeMinDays: 10,
      leadTimeMaxDays: 15,
      acceptsCustomDimensions: true,
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Por pedido');
    expect(fixture.nativeElement.textContent).toContain('10–15 días');
    expect(fixture.nativeElement.textContent).toContain('el precio puede variar');
    expect(fixture.nativeElement.textContent).not.toContain('Sin stock');
    TestBed.inject(I18nService).selectLanguage('en');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Made to order');
    expect(fixture.nativeElement.textContent).toContain('10–15 days');
  });
  it('keeps custom dimensions independent and does not invent production days', () => {
    const fixture = TestBed.createComponent(ProductAvailability);
    fixture.componentRef.setInput('product', {
      ...summary,
      stock: 3,
      acceptsCustomDimensions: true,
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Disponible en stock');
    expect(fixture.nativeElement.textContent).toContain('Admite medidas personalizadas');
    expect(fixture.nativeElement.textContent).not.toContain('Fabricación estimada');
  });
});
