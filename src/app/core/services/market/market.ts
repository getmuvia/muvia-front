import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_ENDPOINTS } from '@core/constants/api-endpoints';
import { createHttpErrorFeedbackContext } from '@core/models/errors/http-error-feedback';
import { Market, StorefrontBootstrap } from '@core/models/market/market';
import { I18nService } from '@core/services/i18n/i18n';

const MARKET_STORAGE_KEY = 'muvia.market';
const BOLIVIA_MARKET: Market = {
  code: 'BO',
  name: 'Bolivia',
  regionCode: 'SOUTH_AMERICA',
  defaultLocale: 'es-BO',
  supportedLocales: ['es-BO'],
  currencyCode: 'BOB',
  flagEmoji: '🇧🇴',
  timeZones: ['America/La_Paz'],
  isActive: true,
  isDefault: true,
  sortOrder: 10,
};

@Injectable({ providedIn: 'root' })
export class MarketService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly i18n = inject(I18nService);

  readonly markets = signal<Market[]>([BOLIVIA_MARKET]);
  readonly selectedMarket = signal<Market>(BOLIVIA_MARKET);
  readonly locale = computed(() => `${this.i18n.language()}-${this.selectedMarket().code}`);

  flagAssetUrl(marketCode: string): string {
    return `/flags/${marketCode.toLowerCase()}.svg`;
  }

  async initialize(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;

    let storedCode: string | null = null;
    try { storedCode = localStorage.getItem(MARKET_STORAGE_KEY); } catch { /* Use detected market. */ }
    const browserLocale = navigator.language || BOLIVIA_MARKET.defaultLocale;
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    let params = new HttpParams().set('locale', browserLocale);
    if (storedCode) params = params.set('countryCode', storedCode);
    if (timeZone) params = params.set('timeZone', timeZone);
    const options = { context: createHttpErrorFeedbackContext('none') };

    try {
      const response = await firstValueFrom(
        this.http.get<StorefrontBootstrap>(API_ENDPOINTS.MARKETS.BOOTSTRAP, {
          ...options,
          params,
        }),
      );
      const activeMarkets = response.markets.filter(market => market.isActive);
      if (activeMarkets.length) this.markets.set(activeMarkets);
      this.selectedMarket.set(response.context.market);
    } catch {
      this.selectedMarket.set(BOLIVIA_MARKET);
    }
  }

  selectMarket(market: Market): void {
    if (!market.isActive) return;
    this.selectedMarket.set(market);
    if (isPlatformBrowser(this.platformId)) {
      try { localStorage.setItem(MARKET_STORAGE_KEY, market.code); } catch { /* Selection still applies. */ }
    }
  }
}
