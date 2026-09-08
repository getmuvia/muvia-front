export interface Market {
  code: string;
  name: string;
  regionCode: string;
  defaultLocale: string;
  supportedLocales: string[];
  currencyCode: string;
  flagEmoji: string;
  timeZones: string[];
  isActive: boolean;
  isDefault: boolean;
  sortOrder: number;
}

export interface StorefrontContext {
  market: Market;
  locale: string;
  detectedCountryCode: string | null;
  detectedMarketAvailable: boolean;
  source: 'selection' | 'edge' | 'timezone' | 'default';
}

export interface StorefrontBootstrap {
  markets: Market[];
  context: StorefrontContext;
}
