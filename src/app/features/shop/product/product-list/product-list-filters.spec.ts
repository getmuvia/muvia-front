import { convertToParamMap } from '@angular/router';
import { composeProductSearchQuery, parseProductListFilters, usesSmartSearch } from './product-list-filters';

describe('Product list filters', () => {
  it('normalizes URL filters and preserves a valid category measurement', () => {
    const filters = parseProductListFilters(convertToParamMap({
      search: '  madera  ', category: ' desk ', dimension: 'width', maxDimensionCm: '120.5',
    }));
    expect(filters).toEqual({ search: 'madera', categoryCode: 'DESK', dimension: 'width', maxDimensionCm: 120.5 });
    expect(usesSmartSearch(filters)).toBe(false);
  });

  it.each([
    { dimension: 'diagonal', maxDimensionCm: '120' },
    { dimension: 'width', maxDimensionCm: '-1' },
    { dimension: 'width', maxDimensionCm: '10001' },
    { dimension: 'width', maxDimensionCm: 'Infinity' },
    { dimension: 'width', maxDimensionCm: '' },
  ])('discards an invalid measurement pair: %j', measurement => {
    const filters = parseProductListFilters(convertToParamMap({ category: 'DESK', ...measurement }));
    expect(filters.dimension).toBe('');
    expect(filters.maxDimensionCm).toBeNull();
  });

  it('ignores measurements without a category, keeping the existing smart-search behavior', () => {
    const filters = parseProductListFilters(convertToParamMap({
      search: 'escritorio', dimension: 'width', maxDimensionCm: '120',
    }));
    expect(filters.dimension).toBe('');
    expect(filters.maxDimensionCm).toBeNull();
    expect(usesSmartSearch(filters)).toBe(true);
  });

  it('treats a short or blank query as an unfiltered catalog request', () => {
    for (const search of [' ', ' a ']) {
      const filters = parseProductListFilters(convertToParamMap({ search }));
      expect(filters.search).toBe('');
      expect(usesSmartSearch(filters)).toBe(false);
    }
  });

  it('preserves unknown category codes for explicit category resolution', () => {
    expect(parseProductListFilters(convertToParamMap({ category: ' unknown ' })).categoryCode).toBe('UNKNOWN');
  });

  it('composes search details without repeating boundary punctuation', () => {
    expect(composeProductSearchQuery(' escritorio;  ', ', de madera ')).toBe('escritorio, de madera');
    expect(composeProductSearchQuery('', ' de madera ')).toBe('de madera');
    expect(composeProductSearchQuery('escritorio', ' , ')).toBe('escritorio');
  });
});
