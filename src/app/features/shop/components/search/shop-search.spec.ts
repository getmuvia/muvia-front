import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, Subject, of, throwError } from 'rxjs';
import { SEARCH_INPUT_CONFIG } from '@core/constants/search-input';
import { HybridSearchResponse, HybridSearchResult } from '@core/models/search/hybrid-search.model';
import { LoggerService } from '@core/services/logger/logger';
import { MarketService } from '@core/services/market/market';
import { HybridSearchService, HYBRID_SEARCH_LIMITS } from '@core/services/search/hybrid-search';
import { ShopSearch } from './shop-search';

const product = (id: string, currencyCode = 'USD', price = 100): HybridSearchResult => ({
  id, title: `Producto ${id}`, description: 'Descripción del vendedor', price, currencyCode,
  category: null, imageUrl: null, score: 0.8, matchType: 'hybrid',
});
const response = (results: HybridSearchResult[] = [], relatedResults: HybridSearchResult[] = []): HybridSearchResponse => ({
  query: 'escritorio', interpretation: { summary: 'Escritorio · Madera', source: 'ai' },
  results, relatedResults, count: results.length,
});

describe('ShopSearch', () => {
  let fixture: ComponentFixture<ShopSearch>;
  const search = vi.fn((): Observable<HybridSearchResponse> => of(response()));
  const logError = vi.fn();

  beforeEach(async () => {
    localStorage.removeItem('muvia.language');
    search.mockReset().mockReturnValue(of(response()));
    logError.mockClear();
    await TestBed.configureTestingModule({
      imports: [ShopSearch],
      providers: [
        { provide: MarketService, useValue: { locale: signal('es-BO') } },
        { provide: HybridSearchService, useValue: { search } },
        { provide: LoggerService, useValue: { error: logError } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ShopSearch);
    await fixture.whenStable();
  });

  afterEach(() => {
    fixture.destroy();
    vi.useRealTimers();
    vi.restoreAllMocks();
    localStorage.removeItem('muvia.language');
  });

  function typeQuery(value: string): HTMLInputElement {
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    return input;
  }

  it('focuses the inline combobox and keeps the preview hidden before a valid query', () => {
    const input = typeQuery(' ab ');
    expect(document.activeElement).toBe(input);
    expect(input.getAttribute('aria-expanded')).toBe('false');
    expect(fixture.nativeElement.querySelector('.search-preview')).toBeNull();
    expect(search).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
  });

  it('debounces typing and sends only the latest normalized query', async () => {
    vi.useFakeTimers();
    typeQuery('mes');
    await vi.advanceTimersByTimeAsync(SEARCH_INPUT_CONFIG.DEBOUNCE_MS / 2);
    typeQuery('  mesa  ');
    await vi.advanceTimersByTimeAsync(SEARCH_INPUT_CONFIG.DEBOUNCE_MS - 1);
    expect(search).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    fixture.detectChanges();
    expect(search).toHaveBeenCalledExactlyOnceWith('mesa', HYBRID_SEARCH_LIMITS.PREVIEW);
    expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain('mesa');
  });

  it('ignores an older response after the query changes', async () => {
    vi.useFakeTimers();
    const stale = new Subject<HybridSearchResponse>();
    search.mockReturnValueOnce(stale).mockReturnValueOnce(of(response([product('actual')])));
    typeQuery('escritorio');
    await vi.advanceTimersByTimeAsync(SEARCH_INPUT_CONFIG.DEBOUNCE_MS);
    typeQuery('sofá');
    stale.next(response([product('anterior')]));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Producto anterior');
    await vi.advanceTimersByTimeAsync(SEARCH_INPUT_CONFIG.DEBOUNCE_MS);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Producto actual');
    expect(fixture.nativeElement.textContent).not.toContain('Producto anterior');
  });

  it('recovers from a failed request on the next search', async () => {
    vi.useFakeTimers();
    search.mockReturnValueOnce(throwError(() => new HttpErrorResponse({ status: 503 })))
      .mockReturnValueOnce(of(response([product('recuperado')])));
    typeQuery('mesa');
    await vi.advanceTimersByTimeAsync(SEARCH_INPUT_CONFIG.DEBOUNCE_MS);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();
    expect(logError).toHaveBeenCalledOnce();
    typeQuery('sofá');
    await vi.advanceTimersByTimeAsync(SEARCH_INPUT_CONFIG.DEBOUNCE_MS);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Producto recuperado');
  });

  it('preserves currencies and interpretation for primary and related results', async () => {
    vi.useFakeTimers();
    const primary = { ...product('principal'), imageUrl: 'https://example.test/product.jpg' };
    search.mockReturnValueOnce(of(response([primary], [product('sugerido', 'PEN', 180.5)])));
    typeQuery('escritorio');
    await vi.advanceTimersByTimeAsync(SEARCH_INPUT_CONFIG.DEBOUNCE_MS);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Muvia entendió');
    expect(text).toContain('Escritorio · Madera');
    expect(text).not.toContain('Ajustar búsqueda');
    const prices = [...fixture.nativeElement.querySelectorAll('app-product-price') as NodeListOf<HTMLElement>]
      .map(element => element.textContent);
    expect(prices[0]).toContain('USD');
    expect(prices[1]).toContain('PEN');
    expect(prices[1]).toContain('180,50');
    expect(text).toContain('Descripción del vendedor');
    expect(fixture.nativeElement.querySelector('img').getAttribute('src')).toBe(primary.imageUrl);
  });

  it('navigates primary and related suggestions with the combobox keyboard', async () => {
    vi.useFakeTimers();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    search.mockReturnValueOnce(of(response([product('principal')], [product('sugerido')])));
    const input = typeQuery('escritorio');
    await vi.advanceTimersByTimeAsync(SEARCH_INPUT_CONFIG.DEBOUNCE_MS);
    fixture.detectChanges();
    for (let step = 0; step < 2; step++) {
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
    }
    fixture.detectChanges();
    expect(input.getAttribute('aria-activedescendant')).toBe('shop-search-option-1');
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    expect(navigate).toHaveBeenCalledWith(['/products', 'sugerido']);
    await Promise.resolve();
  });

  it('submits valid text to the catalog and rejects short queries', async () => {
    vi.useFakeTimers();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    typeQuery('ab');
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit', { cancelable: true }));
    expect(navigate).not.toHaveBeenCalled();
    typeQuery('  sofá beige  ');
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit', { cancelable: true }));
    expect(navigate).toHaveBeenCalledExactlyOnceWith(['/products'], { queryParams: { search: 'sofá beige' } });
    await Promise.resolve();
  });

  it('dismisses from the field without intercepting unrelated document keys', () => {
    const close = vi.fn();
    fixture.componentInstance.close.subscribe(close);
    const unrelated = new KeyboardEvent('keydown', { key: 'ArrowDown', cancelable: true });
    document.dispatchEvent(unrelated);
    expect(unrelated.defaultPrevented).toBe(false);
    fixture.nativeElement.querySelector('input').dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    );
    expect(close).toHaveBeenCalledOnce();
  });
});
