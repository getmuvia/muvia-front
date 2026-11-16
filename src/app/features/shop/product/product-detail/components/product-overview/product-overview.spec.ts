import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
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
  });
});
