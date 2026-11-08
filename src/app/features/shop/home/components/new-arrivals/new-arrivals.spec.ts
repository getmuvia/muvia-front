import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { provideRouter } from '@angular/router';

import { NewArrivals } from './new-arrivals';
import { ProductService } from '@core/services/product/product';
import { NewArrivalsStore } from '@core/services/product/new-arrivals.store';
import { MarketService } from '@core/services/market/market';
import { LoggerService } from '@core/services/logger/logger';

describe('NewArrivals', () => {
  let component: NewArrivals;
  let fixture: ComponentFixture<NewArrivals>;
  let searchProducts: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    searchProducts = vi.fn().mockReturnValue(
      of({ data: [{
        id: 'chair', title: 'Silla de prueba', price: 100, currencyCode: 'BOB',
        category: null, primaryImage: null,
      }], total: 1, page: 1, limit: 4, totalPages: 1 }),
    );

    await TestBed.configureTestingModule({
      imports: [NewArrivals],
      providers: [
        provideRouter([]),
        {
          provide: ProductService,
          useValue: { searchProducts },
        },
        {
          provide: MarketService,
          useValue: {
            selectedMarket: signal({ code: 'BO' }).asReadonly(),
            locale: () => 'es-BO',
          },
        },
        { provide: LoggerService, useValue: { error: vi.fn() } },
      ],
    })
    .compileComponents();

    TestBed.inject(NewArrivalsStore).prefetch();
    fixture = TestBed.createComponent(NewArrivals);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('renders the bootstrap result without requesting the same products again', () => {
    expect(searchProducts).toHaveBeenCalledOnce();
    expect(component.isInitialLoading()).toBe(false);
    expect(fixture.nativeElement.textContent).toContain('Silla de prueba');
  });

  it('releases the shared state when the home section is destroyed', () => {
    fixture.destroy();
    expect(TestBed.inject(NewArrivalsStore).products()).toEqual([]);
  });

  it('distinguishes a load failure from an empty catalog and allows retrying', () => {
    searchProducts.mockReturnValueOnce(throwError(() => new Error('offline')));

    component.retry();
    fixture.detectChanges();

    expect(component.isLoading()).toBe(false);
    expect(component.error()).toBe('No pudimos cargar las novedades. Inténtalo nuevamente.');
    expect(fixture.nativeElement.textContent).toContain('No pudimos cargar las novedades');
    expect(fixture.nativeElement.textContent).not.toContain('No hay novedades por el momento');

    searchProducts.mockReturnValueOnce(
      of({ data: [], total: 0, page: 1, limit: 4, totalPages: 0 }),
    );
    component.retry();

    expect(component.error()).toBeNull();
  });
});
