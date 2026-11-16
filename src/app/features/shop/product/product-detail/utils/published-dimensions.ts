import type { ProductDimensions } from '@core/models/product/product';

/** Keep incomplete catalog measurements out of price references and diagrams. */
export function normalizePublishedDimensions(
  dimensions: ProductDimensions | null | undefined,
): ProductDimensions | null {
  if (!dimensions || typeof dimensions.unit !== 'string' || !dimensions.unit.trim()) return null;
  const width = positiveMeasurement(dimensions.width);
  const depth = positiveMeasurement(dimensions.depth);
  const height = positiveMeasurement(dimensions.height);
  if (width === null || depth === null || height === null) return null;
  return { width, depth, height, unit: dimensions.unit.trim() };
}

export function formatPublishedDimensions(dimensions: ProductDimensions, locale: string): string {
  const formatter = new Intl.NumberFormat(locale, { maximumFractionDigits: 6 });
  return (
    [dimensions.width, dimensions.depth, dimensions.height]
      .map((value) => formatter.format(value))
      .join(' × ') + ` ${dimensions.unit}`
  );
}

function positiveMeasurement(value: unknown): number | null {
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}
