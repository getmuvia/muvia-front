import type { Product } from './product';

export interface ProductImageSummary {
  url: string;
  alt: string | null;
}

/** Public catalog projection. Full specifications and assets belong to the detail. */
export interface ProductSummary {
  id: string;
  title: string;
  price: number;
  currencyCode: string;
  category: { id: string; name: string } | null;
  primaryImage: ProductImageSummary | null;
}

export type ProductPreview = Product | ProductSummary;

export function productPreviewImage(product: ProductPreview): ProductImageSummary | null {
  if ('primaryImage' in product) return product.primaryImage;

  const images = product.assets?.filter(asset => asset.type === 'image' && asset.url);
  const image = images?.find(asset => asset.isPrimary) ?? images?.[0];
  return image ? { url: image.url, alt: image.metadata?.alt ?? null } : null;
}
