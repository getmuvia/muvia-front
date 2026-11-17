import type { ProductDimensions } from '../product/product';
import { QUOTATION_AXES, QUOTATION_LIMITS, QUOTATION_UNIT_CM } from './quotation';

export function quotationDimensions(
  value: ProductDimensions | null | undefined,
): ProductDimensions | null {
  if (!value || typeof value.unit !== 'string') return null;
  const unit = value.unit.trim().toLowerCase();
  const factor = QUOTATION_UNIT_CM[unit as keyof typeof QUOTATION_UNIT_CM];
  if (
    !factor ||
    !QUOTATION_AXES.every(({ key }) => validQuotationMeasurement(Number(value[key]), factor))
  )
    return null;
  return {
    width: Number(value.width),
    depth: Number(value.depth),
    height: Number(value.height),
    unit,
  };
}

export function validQuotationMeasurement(value: number, factor: number): boolean {
  return (
    Number.isFinite(value) &&
    value * factor >= QUOTATION_LIMITS.minimumDimensionCm &&
    value * factor <= QUOTATION_LIMITS.maximumDimensionCm
  );
}

export function dimensionPrecisionValid(value: number): boolean {
  return Math.abs(value * 1000 - Math.round(value * 1000)) < 0.000001;
}
