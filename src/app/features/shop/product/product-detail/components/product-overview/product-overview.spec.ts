import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import type { Product } from '@core/models/product/product';
import { ProductCondition } from '@core/models/product/product-condition';
import { I18nService } from '@core/services/i18n/i18n';
import { MarketService } from '@core/services/market/market';
import { productFixture } from '../../testing/product-fixture';
import { ProductOverview } from './product-overview';
import { ProductAvailabilityMode } from '@core/models/product/product-availability';

describe('Published product overview', () => {
  const selectedMarket = signal({ code: 'BO' });

  beforeEach(() => {
    selectedMarket.set({ code: 'BO' });
    localStorage.removeItem('muvia.language');
    TestBed.configureTestingModule({
      imports: [ProductOverview],
      providers: [
        { provide: MarketService, useValue: { selectedMarket, locale: signal('es-BO') } },
      ],
    });
  });

  afterEach(() => localStorage.removeItem('muvia.language'));

  it('uses stock from the same market listing as the product price, including zero', () => {
    const fixture = TestBed.createComponent(ProductOverview);
    fixture.componentRef.setInput('product', productFixture());
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('2 unidades');
    selectedMarket.set({ code: 'PE' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('0 unidades');
    expect(fixture.nativeElement.textContent).not.toContain('Por pedido');
  });

  it('preserves seller text and handles a product without specifications or description', () => {
    const fixture = TestBed.createComponent(ProductOverview);
    fixture.componentRef.setInput('product', productFixture());
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Descripción original del vendedor.');
    expect(fixture.nativeElement.textContent).toContain('Roble macizo');
    fixture.componentRef.setInput(
      'product',
      productFixture({ specifications: null, description: '' }),
    );
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('todavía no ha añadido una descripción');
    expect(fixture.nativeElement.textContent).not.toContain('Roble macizo');
  });
  it('shows made-to-order availability instead of a zero-stock row', () => {
    const fixture = TestBed.createComponent(ProductOverview);
    fixture.componentRef.setInput(
      'product',
      productFixture({
        availabilityMode: ProductAvailabilityMode.MADE_TO_ORDER,
        leadTimeMinDays: 10,
        leadTimeMaxDays: 15,
        acceptsCustomDimensions: true,
      }),
    );
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Por pedido');
    expect(fixture.nativeElement.textContent).toContain('10–15 días');
    expect(fixture.nativeElement.textContent).not.toContain('unidades');
    fixture.componentRef.setInput('canCustomize', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Medidas personalizables');
    expect(fixture.nativeElement.textContent).toContain('Personalizar medidas');
  });
  it('keeps 3D and AR available when there are no product photos', () => {
    const fixture = TestBed.createComponent(ProductOverview);
    fixture.componentRef.setInput('product', productFixture({
      assets: [{
        id: 'glb',
        productId: 'desk',
        type: 'model_3d',
        url: 'https://example.test/desk.glb',
        isPrimary: false,
        metadata: { format: 'glb' },
      }],
    }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-product-visualization').textContent)
      .toContain('Ver en 3D');
    expect(fixture.nativeElement.querySelector('app-product-visualization').textContent)
      .toContain('Ver en tu espacio (AR)');
  });
});

describe('Product overview pricing and actions', () => {
  let fixture: ComponentFixture<ProductOverview>;
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
      imports: [ProductOverview],
      providers: [{ provide: MarketService, useValue: { selectedMarket, locale } }],
    }).compileComponents();
    fixture = TestBed.createComponent(ProductOverview);
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

});
