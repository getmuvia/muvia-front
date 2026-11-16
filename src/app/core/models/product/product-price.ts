import type { ProductPreview } from './product-summary';
import type { Product, ProductListing } from './product';

export interface ProductPriceValue {
  amount: number;
  currencyCode: string;
}

/** Resolves an amount and its currency together; it does not convert currencies. */
export function resolveProductPrice(
  product: ProductPreview,
  marketCode: string,
): ProductPriceValue {
  if ('currencyCode' in product) {
    return { amount: product.price, currencyCode: product.currencyCode };
  }

  const listing = resolveProductListing(product, marketCode);
  if (listing) return { amount: Number(listing.price), currencyCode: listing.currencyCode };

  // The legacy product contract has no currency; preserve its original Bolivia pricing.
  return { amount: Number(product.price) || 0, currencyCode: 'BOB' };
}

/** Use the same commercial offer for price, currency and stock. */
export function resolveProductListing(product: Product, marketCode: string): ProductListing | null {
  const listings = product.listings ?? [];
  return (
    listings.find((listing) => listing.marketCode === marketCode && listing.isActive) ??
    listings.find((listing) => listing.isActive) ??
    listings.find((listing) => listing.marketCode === marketCode) ??
    listings[0] ??
    null
  );
}
