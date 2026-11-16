import type { ProductPreview } from './product-summary';
import { resolveProductListing } from './product-price';

export enum ProductAvailabilityMode {
  IN_STOCK = 'IN_STOCK',
  MADE_TO_ORDER = 'MADE_TO_ORDER',
}

/** Optional while clients and existing API deployments roll out independently. */
export interface ProductAvailabilityFields {
  availabilityMode?: ProductAvailabilityMode;
  leadTimeMinDays?: number | null;
  leadTimeMaxDays?: number | null;
  acceptsCustomDimensions?: boolean;
}

export const MAX_PRODUCT_LEAD_TIME_DAYS = 2147483647;

export interface ResolvedProductAvailability {
  status: 'madeToOrder' | 'inStock' | 'outOfStock' | 'unknown';
  productionRange: { min: number; max: number } | null;
  acceptsCustomDimensions: boolean;
}

export function isProductionDayCount(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value > 0 &&
    value <= MAX_PRODUCT_LEAD_TIME_DAYS
  );
}

export function isProductAvailabilityMode(value: unknown): value is ProductAvailabilityMode {
  return Object.values(ProductAvailabilityMode).includes(value as ProductAvailabilityMode);
}

export function resolveProductAvailability(
  product: ProductPreview,
  marketCode: string,
): ResolvedProductAvailability {
  const madeToOrder = product.availabilityMode === ProductAvailabilityMode.MADE_TO_ORDER;
  const stock =
    'currencyCode' in product
      ? product.stock
      : (resolveProductListing(product, marketCode)?.stock ?? product.stock);
  const min = product.leadTimeMinDays;
  const max = product.leadTimeMaxDays;
  const productionRange =
    madeToOrder && isProductionDayCount(min) && isProductionDayCount(max) && min <= max
      ? { min, max }
      : null;
  return {
    status: madeToOrder ? 'madeToOrder' : stockStatus(stock),
    productionRange,
    acceptsCustomDimensions: product.acceptsCustomDimensions === true,
  };
}

function stockStatus(stock: number | undefined): ResolvedProductAvailability['status'] {
  if (typeof stock !== 'number' || !Number.isFinite(stock)) return 'unknown';
  return stock > 0 ? 'inStock' : 'outOfStock';
}
