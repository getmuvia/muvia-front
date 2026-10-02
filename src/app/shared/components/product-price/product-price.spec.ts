import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MarketService } from '@core/services/market/market';
import { ProductPrice } from './product-price';

describe('ProductPrice', () => {
  let fixture: ComponentFixture<ProductPrice>;
  const locale = signal('es-BO');
  const text = () => (fixture.nativeElement.textContent as string).trim().replace(/\s+/g, ' ');

  beforeEach(async () => {
    locale.set('es-BO');
    await TestBed.configureTestingModule({
      imports: [ProductPrice],
      providers: [{ provide: MarketService, useValue: { locale } }],
    }).compileComponents();
    fixture = TestBed.createComponent(ProductPrice);
    fixture.componentRef.setInput('amount', 1234.5);
    fixture.componentRef.setInput('currencyCode', 'BOB');
    fixture.detectChanges();
  });

  it('formats bolivianos with the market locale', () => {
    expect(text()).toBe('Bs 1.234,50');
  });

  it('shows the provided currency instead of assuming bolivianos', () => {
    fixture.componentRef.setInput('currencyCode', 'USD');
    fixture.detectChanges();
    expect(text()).toBe('USD 1.234,50');
  });

  it('updates formatting when the locale changes without converting the amount', () => {
    fixture.componentRef.setInput('currencyCode', 'PEN');
    fixture.detectChanges();
    expect(text()).toBe('PEN 1.234,50');
    locale.set('es-PE');
    fixture.detectChanges();
    expect(text()).toBe('S/ 1,234.50');
  });

  it('uses the currency precision and responds to amount changes', () => {
    fixture.componentRef.setInput('currencyCode', 'JPY');
    fixture.detectChanges();
    expect(text()).toBe('JPY 1.235');
    fixture.componentRef.setInput('amount', 2000);
    fixture.detectChanges();
    expect(text()).toBe('JPY 2.000');
  });
});
