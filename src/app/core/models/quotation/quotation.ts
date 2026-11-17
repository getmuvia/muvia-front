import type { ProductDimensions } from '../product/product';

export type QuotationStatus = 'PENDING' | 'QUOTED' | 'DECLINED';
export type QuotationView = 'sent' | 'received';

export const QUOTATION_STATUS_LABELS = {
  PENDING: 'quotations.pending',
  QUOTED: 'quotations.quoted',
  DECLINED: 'quotations.declined',
} as const;

export const QUOTATION_LIMITS = {
  notesLength: 2000,
  minimumDimensionCm: 0.1,
  maximumDimensionCm: 10000,
  maximumPrice: 99999999.99,
  maximumProductionDays: 2147483647,
  pageSize: 20,
} as const;
export const QUOTATION_UNIT_CM = { cm: 1, m: 100, in: 2.54 } as const;
export const QUOTATION_AXES = [
  { key: 'width', label: 'common.width' },
  { key: 'depth', label: 'catalog.depth' },
  { key: 'height', label: 'common.height' },
] as const;

export interface Quotation {
  id: string;
  productId: string | null;
  customerId: string;
  sellerId: string;
  customerEmail: string;
  sellerName: string | null;
  productTitle: string;
  productImageUrl: string | null;
  marketCode: string;
  currencyCode: string;
  publishedPrice: string;
  publishedDimensions: ProductDimensions;
  requestedDimensions: ProductDimensions;
  notes: string;
  status: QuotationStatus;
  quotedPrice: string | null;
  leadTimeMinDays: number | null;
  leadTimeMaxDays: number | null;
  responseMessage: string | null;
  respondedAt: string | null;
  sellerViewedAt: string | null;
  customerViewedAt: string | null;
  createdAt: string;
}

export interface CreateQuotation {
  requestId: string;
  productId: string;
  marketCode: string;
  dimensions: ProductDimensions;
  notes: string;
}

export type RespondQuotation =
  | {
      status: 'QUOTED';
      price: number;
      leadTimeMinDays: number;
      leadTimeMaxDays: number;
      message: string;
    }
  | { status: 'DECLINED'; message: string };

export interface QuotationPage {
  data: Quotation[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function isUnreadQuotation(quotation: Quotation, view: QuotationView): boolean {
  if (view === 'received') return !quotation.sellerViewedAt;
  return (
    !!quotation.respondedAt &&
    (!quotation.customerViewedAt || quotation.respondedAt > quotation.customerViewedAt)
  );
}
