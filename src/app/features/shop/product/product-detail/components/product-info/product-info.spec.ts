import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Product } from '@core/models/product/product';
import { ProductCondition } from '@core/models/product/product-condition';
import { I18nService } from '@core/services/i18n/i18n';
import { MarketService } from '@core/services/market/market';
import { ProductInfo } from './product-info';
import { productFixture } from '../../testing/product-fixture';

describe('ProductInfo pricing', () => {
  let fixture: ComponentFixture<ProductInfo>;
  const selectedMarket = signal({ code: 'BO' });
  const locale = signal('es-BO');
  const product: Product = {
    condition: ProductCondition.NEW,
    id: 'product',
    title: 'Escritorio',
    description: '',
    sellerId: 'seller',
    categoryId: 'category',
    price: '999',
    stock: 1,
    specifications: {},
    keywords: [],
    createdAt: '',
    assets: [],
    category: {
      id: 'category',
      name: 'Escritorios',
      parentId: null,
      description: '',
      imageUrl: '',
      level: 1,
    },
    listings: [
      { id: 'bo', marketCode: 'BO', price: '100', currencyCode: 'BOB', stock: 1, isActive: true },
      {
        id: 'pe',
        marketCode: 'PE',
        price: '180.50',
        currencyCode: 'PEN',
        stock: 1,
        isActive: true,
      },
    ],
  };

  beforeEach(async () => {
    localStorage.removeItem('muvia.language');
    selectedMarket.set({ code: 'BO' });
    locale.set('es-BO');
    await TestBed.configureTestingModule({
      imports: [ProductInfo],
      providers: [{ provide: MarketService, useValue: { selectedMarket, locale } }],
    }).compileComponents();
    fixture = TestBed.createComponent(ProductInfo);
    fixture.componentRef.setInput('product', product);
    fixture.detectChanges();
  });

  it('uses the market listing for detail prices and updates the currency with the amount', () => {
    expect(fixture.nativeElement.querySelector('app-product-price').textContent).toContain(
      '100,00',
    );
    selectedMarket.set({ code: 'PE' });
    locale.set('es-PE');
    fixture.detectChanges();
    const price = fixture.nativeElement.querySelector('app-product-price').textContent as string;
    expect(price).toContain('S/');
    expect(price).toContain('180.50');
    expect(price).not.toContain('999');
  });

  it('shows the product condition in the detail and translates its label', () => {
    fixture.componentRef.setInput('product', { ...product, condition: ProductCondition.USED });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-product-condition]').textContent).toContain(
      'Usado',
    );
    const i18n = TestBed.inject(I18nService);
    i18n.selectLanguage('en');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-product-condition]').textContent).toContain(
      'Used',
    );
    i18n.selectLanguage('es');
  });

  it('retains a known foreign price currency when the current market has no listing', () => {
    fixture.componentRef.setInput('product', { ...product, listings: [product.listings![1]] });
    fixture.detectChanges();
    const price = fixture.nativeElement.querySelector('app-product-price').textContent as string;
    expect(price).toContain('PEN');
    expect(price).toContain('180,50');
    expect(price).not.toContain('Bs');
  });

  it('links the product to its seller public store', () => {
    expect(fixture.nativeElement.querySelector('a[href="/stores/seller"]')?.textContent).toContain(
      'Ver comercio',
    );
  });

  it('associates the displayed price with the published dimensions in width, depth, height order', () => {
    fixture.componentRef.setInput('product', productFixture());
    fixture.detectChanges();
    const context = fixture.nativeElement.querySelector('[data-price-dimensions]').textContent;
    expect(context).toContain('140 × 60 × 75 cm');
    expect(fixture.nativeElement.textContent).not.toContain('A cotizar');
    expect(fixture.nativeElement.querySelector('input')).toBeNull();
    fixture.componentRef.setInput('product', productFixture({ specifications: null }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-price-dimensions]')).toBeNull();
  });

  it('keeps the existing pilot inquiry and AI visualization connected to the current product', () => {
    fixture.componentRef.setInput('product', productFixture());
    fixture.detectChanges();
    const inquiry = fixture.nativeElement
      .querySelector('a[href^="mailto:"]')
      .getAttribute('href') as string;
    expect(decodeURIComponent(inquiry)).toContain(productFixture().title);
    expect(decodeURIComponent(inquiry)).toContain('desk');
    expect(
      fixture.nativeElement.querySelector('a[href="/virtual-staging?productId=desk"]'),
    ).not.toBeNull();
  });

  it('copies the current product link and translates feedback without translating seller content', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    try {
      await fixture.componentInstance.shareProduct();
      fixture.detectChanges();
      expect(writeText).toHaveBeenCalledWith('https://app.getmuvia.com/products/product');
      expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain(
        'Enlace copiado',
      );
      TestBed.inject(I18nService).selectLanguage('en');
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain(
        'Link copied',
      );
      expect(fixture.nativeElement.querySelector('h1').textContent).toBe('Escritorio');
    } finally {
      vi.unstubAllGlobals();
      TestBed.inject(I18nService).selectLanguage('es');
    }
  });
});
