import { Component } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Product } from '@core/models/product/product';
import { ProductCondition } from '@core/models/product/product-condition';
import { I18nService } from '@core/services/i18n/i18n';
import { MarketService } from '@core/services/market/market';
import { ProductCard } from '@shared/components/product-card/product-card';
import { ProductTabs } from '@features/shop/product/product-detail/components/product-tabs/product-tabs';
import { LanguageSelector } from './language-selector';

@Component({
  imports: [LanguageSelector, ProductCard, ProductTabs],
  template: `<app-language-selector /><app-product-card [product]="product" /><app-product-tabs [product]="product" />`,
})
class BilingualProductHost {
  readonly product: Product = {
    condition: ProductCondition.NEW,
    id: 'desk', sellerId: 'seller', categoryId: 'category', title: 'Guardar',
    description: 'Descripción original del vendedor.', price: '1234.50', stock: 1,
    specifications: { material: 'Roble macizo', color: 'Negro mate', weight: '15 kg' },
    keywords: ['madera'], createdAt: '', assets: [],
    category: { id: 'category', code: 'DESK', name: 'Escritorios', description: '', parentId: null, imageUrl: '', level: 1 },
    listings: [{ id: 'listing', marketCode: 'BO', price: '1234.50', currencyCode: 'BOB', stock: 1, isActive: true }],
  };
}

describe('bilingual product presentation', () => {
  beforeEach(() => {
    localStorage.removeItem('muvia.language');
    TestBed.configureTestingModule({ imports: [BilingualProductHost], providers: [provideHttpClient()] });
  });
  afterEach(() => localStorage.removeItem('muvia.language'));

  it('changes UI language through the selector and preserves seller content and prices', () => {
    const fixture = TestBed.createComponent(BilingualProductHost);
    const original = structuredClone(fixture.componentInstance.product);
    fixture.detectChanges();
    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    expect(select.getAttribute('aria-label')).toBe('Idioma');
    select.value = 'en';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(select.getAttribute('aria-label')).toBe('Language');
    expect(text).toContain('Desks');
    expect(text).toContain('Image unavailable');
    expect(text).toContain('Guardar');
    expect(text).toContain('Descripción original del vendedor.');
    expect(text).toContain('1,234.50');
    expect(text).toContain('BOB');
    expect(TestBed.inject(MarketService).selectedMarket().code).toBe('BO');
    expect(fixture.componentInstance.product).toEqual(original);

    const details = fixture.nativeElement.querySelectorAll('app-product-tabs button')[1] as HTMLButtonElement;
    details.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Weight');
    expect(fixture.nativeElement.textContent).toContain('Roble macizo');
    expect(fixture.nativeElement.textContent).toContain('Negro mate');
    expect(fixture.nativeElement.textContent).toContain('1 unit');

    TestBed.inject(I18nService).selectLanguage('es');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Escritorios');
    expect(fixture.nativeElement.textContent).toContain('1.234,50');
  });
});
