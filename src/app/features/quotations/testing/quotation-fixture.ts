import type { Quotation } from '@core/models/quotation/quotation';

export function quotationFixture(overrides: Partial<Quotation> = {}): Quotation {
  return {
    id: 'quotation-1',
    productId: 'desk',
    customerId: 'customer',
    sellerId: 'seller',
    customerEmail: 'customer@example.test',
    sellerName: 'Estudio Roble',
    productTitle: 'Escritorio Roble',
    productImageUrl: null,
    marketCode: 'BO',
    currencyCode: 'BOB',
    publishedPrice: '2450.00',
    publishedDimensions: { width: 140, depth: 60, height: 75, unit: 'cm' },
    requestedDimensions: { width: 160, depth: 70, height: 75, unit: 'cm' },
    notes: 'Necesito más espacio.',
    status: 'PENDING',
    quotedPrice: null,
    leadTimeMinDays: null,
    leadTimeMaxDays: null,
    responseMessage: null,
    respondedAt: null,
    sellerViewedAt: null,
    customerViewedAt: null,
    createdAt: '2026-11-16T12:00:00.000Z',
    ...overrides,
  };
}
