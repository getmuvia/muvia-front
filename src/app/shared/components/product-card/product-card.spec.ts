import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

import { Product } from '@core/models/product/product';
import { MarketService } from '@core/services/market/market';
import { ProductCard } from './product-card';

describe('ProductCard', () => {
  let component: ProductCard;
  let fixture: ComponentFixture<ProductCard>;
  const selectedMarket = signal({ code: 'BO' });
  const locale = signal('es-BO');

  beforeEach(async () => {
    selectedMarket.set({ code: 'BO' });
    locale.set('es-BO');
    await TestBed.configureTestingModule({
      imports: [ProductCard],
      providers: [{ provide: MarketService, useValue: { selectedMarket, locale } }],
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductCard);
    const product: Product = {
      id: 'product-id',
      sellerId: 'seller-id',
      categoryId: 'category-id',
      title: 'Producto de prueba',
      description: 'Descripción de prueba',
      price: '100',
      stock: 1,
      specifications: {},
      keywords: [],
      createdAt: '2026-09-10T00:00:00.000Z',
      assets: [],
      category: {
        id: 'category-id',
        parentId: null,
        name: 'Categoría de prueba',
        description: '',
        imageUrl: '',
        level: 0,
      },
    };
    fixture.componentRef.setInput('product', product);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the catalog projection without requiring full product assets', () => {
    fixture.componentRef.setInput('product', {
      id: 'summary-id',
      title: 'Escritorio',
      price: 800,
      currencyCode: 'BOB',
      category: { id: 'category-id', name: 'Escritorios' },
      primaryImage: { url: 'https://example.com/desk.webp', alt: 'Vista del escritorio' },
    });
    fixture.detectChanges();

    expect(component.imageUrl()).toBe('https://example.com/desk.webp');
    expect(component.altText()).toBe('Vista del escritorio');
    expect(fixture.nativeElement.textContent).toContain('Escritorios');
    expect(fixture.nativeElement.textContent).toContain('800,00');
  });

  it('handles a catalog product without a category or an image', () => {
    fixture.componentRef.setInput('product', {
      id: 'summary-id', title: 'Producto', price: 0, currencyCode: 'BOB',
      category: null, primaryImage: null,
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Sin categoría');
    expect(fixture.nativeElement.textContent).toContain('Imagen no disponible');
  });

  it('renders the summary currency and keeps the detail link for a search result', () => {
    fixture.componentRef.setInput('product', {
      id: 'search-id', title: 'Escritorio', price: 35.5, currencyCode: 'USD',
      category: null, primaryImage: null, score: 0.8, matchType: 'hybrid',
    });
    fixture.detectChanges();
    const price = fixture.nativeElement.querySelector('.product-price').textContent as string;
    expect(price).toContain('USD');
    expect(price).toContain('35,50');
    expect(price).not.toContain('Bs');
    expect(fixture.nativeElement.querySelector('a').getAttribute('href')).toBe('/products/search-id');
  });

  it('updates the amount and currency together for full product listings', () => {
    fixture.componentRef.setInput('product', {
      ...component.product(),
      listings: [
        { id: 'bo', marketCode: 'BO', price: '100', currencyCode: 'BOB', stock: 1, isActive: true },
        { id: 'pe', marketCode: 'PE', price: '180.50', currencyCode: 'PEN', stock: 1, isActive: true },
      ],
    });
    fixture.detectChanges();
    expect(component.price()).toEqual({ amount: 100, currencyCode: 'BOB' });
    selectedMarket.set({ code: 'PE' });
    locale.set('es-PE');
    fixture.detectChanges();
    const price = fixture.nativeElement.querySelector('.product-price').textContent as string;
    expect(price).toContain('S/');
    expect(price).toContain('180.50');
    expect(price).not.toContain('100');
  });

  it('keeps the preview fallback when an image fails to load', () => {
    fixture.componentRef.setInput('product', {
      id: 'summary', title: 'Escritorio', price: 100, currencyCode: 'BOB', category: null,
      primaryImage: { url: 'https://example.com/desk.webp', alt: null },
    });
    fixture.detectChanges();
    expect(component.altText()).toBe('Escritorio');
    fixture.nativeElement.querySelector('img').dispatchEvent(new Event('error'));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Imagen no disponible');
    expect(fixture.nativeElement.querySelector('img')).toBeNull();
  });
});
