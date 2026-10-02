import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { MarketService } from '@core/services/market/market';
import { HybridSearchService } from '@core/services/search/hybrid-search';
import { LoggerService } from '@core/services/logger/logger';
import { SmartSearchModal } from './smart-search-modal';

describe('SmartSearchModal', () => {
  let component: SmartSearchModal;
  let fixture: ComponentFixture<SmartSearchModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SmartSearchModal],
      providers: [
        { provide: MarketService, useValue: { locale: signal('es-BO') } },
        {
          provide: HybridSearchService,
          useValue: { search: () => undefined },
        },
        {
          provide: LoggerService,
          useValue: { error: () => undefined },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SmartSearchModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders a compact interpretation without refinement controls', () => {
    component.query.set('escritorio de madera');
    component.interpretation.set({
      summary: 'Escritorio · Madera',
      source: 'ai',
    });
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Muvia entendió');
    expect(text).toContain('Escritorio · Madera');
    expect(text).not.toContain('Ajustar búsqueda');
  });

  it('preserves the currency of both primary results and related suggestions', () => {
    const result = {
      id: 'primary', title: 'Escritorio', description: null, price: 100,
      imageUrl: null, score: 0.8, matchType: 'hybrid' as const,
    };
    component.primaryResults.set([{ ...result, currencyCode: 'USD' }]);
    component.relatedResults.set([{ ...result, id: 'related', currencyCode: 'PEN', price: 180.5 }]);
    fixture.detectChanges();
    const prices = Array.from(fixture.nativeElement.querySelectorAll('app-product-price') as NodeListOf<HTMLElement>)
      .map(price => price.textContent);
    expect(prices[0]).toContain('USD');
    expect(prices[1]).toContain('PEN');
    expect(prices[1]).toContain('180,50');
    expect(prices.join(' ')).not.toContain('Bs');
  });
});
