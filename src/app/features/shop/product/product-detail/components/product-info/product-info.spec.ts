import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Product } from '@core/models/product/product';
import { MarketService } from '@core/services/market/market';
import { ProductInfo } from './product-info';

describe('ProductInfo pricing', () => {
  let fixture: ComponentFixture<ProductInfo>;
  const selectedMarket = signal({ code: 'BO' });
  const locale = signal('es-BO');
  const product: Product = {
    id: 'product', title: 'Escritorio', description: '', sellerId: 'seller', categoryId: 'category',
    price: '999', stock: 1, specifications: {}, keywords: [], createdAt: '', assets: [],
    category: { id: 'category', name: 'Escritorios', parentId: null, description: '', imageUrl: '', level: 1 },
    listings: [
      { id: 'bo', marketCode: 'BO', price: '100', currencyCode: 'BOB', stock: 1, isActive: true },
      { id: 'pe', marketCode: 'PE', price: '180.50', currencyCode: 'PEN', stock: 1, isActive: true },
    ],
  };

  beforeEach(async () => {
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
    expect(fixture.nativeElement.querySelector('app-product-price').textContent).toContain('100,00');
    selectedMarket.set({ code: 'PE' });
    locale.set('es-PE');
    fixture.detectChanges();
    const price = fixture.nativeElement.querySelector('app-product-price').textContent as string;
    expect(price).toContain('S/');
    expect(price).toContain('180.50');
    expect(price).not.toContain('999');
  });

  it('retains a known foreign price currency when the current market has no listing', () => {
    fixture.componentRef.setInput('product', { ...product, listings: [product.listings![1]] });
    fixture.detectChanges();
    const price = fixture.nativeElement.querySelector('app-product-price').textContent as string;
    expect(price).toContain('PEN');
    expect(price).toContain('180,50');
    expect(price).not.toContain('Bs');
  });
});
