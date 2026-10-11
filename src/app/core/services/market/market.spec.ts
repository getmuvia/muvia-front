import { HttpClient, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_ENDPOINTS } from '@core/constants/api-endpoints';
import { Market } from '@core/models/market/market';
import { I18nService } from '@core/services/i18n/i18n';
import { MarketService } from './market';

const peru: Market = {
  code: 'PE', name: 'Perú', regionCode: 'SOUTH_AMERICA', defaultLocale: 'es-PE',
  supportedLocales: ['es-PE'], currencyCode: 'PEN', flagEmoji: '', timeZones: [],
  isActive: true, isDefault: false, sortOrder: 20,
};

describe('language and market independence', () => {
  beforeEach(() => {
    localStorage.removeItem('muvia.language');
    localStorage.removeItem('muvia.market');
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
  });
  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
    localStorage.removeItem('muvia.language');
    localStorage.removeItem('muvia.market');
  });

  it('changes number formatting without changing the country or currency', () => {
    const market = TestBed.inject(MarketService);
    const bolivia = market.selectedMarket();
    TestBed.inject(I18nService).selectLanguage('en');
    expect(market.locale()).toBe('en-BO');
    expect(market.selectedMarket()).toBe(bolivia);
    expect(market.selectedMarket().currencyCode).toBe('BOB');
  });

  it('retains English when switching to a Spanish-speaking market', () => {
    const market = TestBed.inject(MarketService);
    TestBed.inject(I18nService).selectLanguage('en');
    market.selectMarket(peru);
    expect(market.locale()).toBe('en-PE');
    expect(market.selectedMarket().currencyCode).toBe('PEN');
    expect(localStorage.getItem('muvia.language')).toBe('en');
    expect(localStorage.getItem('muvia.market')).toBe('PE');
  });

  it('does not overwrite a language choice when the bootstrap request completes', async () => {
    // Resolve HttpClient before bootstrap to ensure the testing backend is installed.
    TestBed.inject(HttpClient);
    const market = TestBed.inject(MarketService);
    const pending = market.initialize();
    TestBed.inject(I18nService).selectLanguage('en');
    TestBed.inject(HttpTestingController).expectOne(request => request.url === API_ENDPOINTS.MARKETS.BOOTSTRAP)
      .flush({ markets: [peru], context: { market: peru, locale: 'es-PE' } });
    await pending;
    expect(market.locale()).toBe('en-PE');
  });

  it('does not overwrite English when market bootstrap fails', async () => {
    const market = TestBed.inject(MarketService);
    TestBed.inject(I18nService).selectLanguage('en');
    const pending = market.initialize();
    TestBed.inject(HttpTestingController).expectOne(request => request.url === API_ENDPOINTS.MARKETS.BOOTSTRAP)
      .flush({}, { status: 503, statusText: 'Unavailable' });
    await pending;
    expect(market.locale()).toBe('en-BO');
  });
});
