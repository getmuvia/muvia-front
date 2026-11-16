import type { ProductDimensions } from '@core/models/product/product';
import { formatPublishedDimensions, normalizePublishedDimensions } from './published-dimensions';

describe('Published product dimensions', () => {
  const dimensions = { width: 140, depth: 60, height: 75, unit: 'cm' };

  it('normalizes valid API measurements without changing their unit or the source object', () => {
    const source = {
      width: '1.4',
      depth: '0.6',
      height: '0.75',
      unit: ' m ',
    } as unknown as ProductDimensions;
    expect(normalizePublishedDimensions(source)).toEqual({
      width: 1.4,
      depth: 0.6,
      height: 0.75,
      unit: 'm',
    });
    expect(source.unit).toBe(' m ');
  });

  it.each([
    null,
    undefined,
    { ...dimensions, width: 0 },
    { ...dimensions, depth: -1 },
    { ...dimensions, height: NaN },
    { ...dimensions, width: Infinity },
    { ...dimensions, unit: '' },
    { ...dimensions, unit: undefined },
    { ...dimensions, width: true },
    { ...dimensions, depth: null },
  ])('does not invent measurements for incomplete catalog data: %j', (value) => {
    expect(normalizePublishedDimensions(value as ProductDimensions | null | undefined)).toBeNull();
  });

  it('formats width, depth and height in that order, preserving fractional units', () => {
    const value = { width: 1.4, depth: 0.6, height: 0.075, unit: 'm' };
    expect(formatPublishedDimensions(value, 'es-BO')).toBe('1,4 × 0,6 × 0,075 m');
    expect(formatPublishedDimensions(value, 'en-US')).toBe('1.4 × 0.6 × 0.075 m');
  });
});
