import { ParamMap } from '@angular/router';
import { SEARCH_INPUT_CONFIG } from '@core/constants/search-input';
import {
  ProductDimension,
  findProductDimension,
  parseMaxDimensionCm,
} from '@core/models/product/product-dimension-filter';

export interface ProductListFilters {
  search: string;
  categoryCode: string;
  dimension: ProductDimension | '';
  maxDimensionCm: number | null;
}

export function parseProductListFilters(params: ParamMap): ProductListFilters {
  const search = (params.get('search') ?? '').trim();
  const categoryCode = (params.get('category') ?? '').trim().toUpperCase();
  const dimension = findProductDimension(params.get('dimension'));
  const maximum = parseMaxDimensionCm(params.get('maxDimensionCm'));
  const hasMeasurement = Boolean(categoryCode && dimension && maximum);

  return {
    search: search.length >= SEARCH_INPUT_CONFIG.MIN_QUERY_LENGTH ? search : '',
    categoryCode,
    dimension: hasMeasurement && dimension ? dimension.value : '',
    maxDimensionCm: hasMeasurement ? maximum : null,
  };
}

export function sameProductListFilters(previous: ProductListFilters, current: ProductListFilters): boolean {
  return previous.search === current.search
    && previous.categoryCode === current.categoryCode
    && previous.dimension === current.dimension
    && previous.maxDimensionCm === current.maxDimensionCm;
}

export function usesSmartSearch(filters: ProductListFilters): boolean {
  return Boolean(filters.search && !filters.categoryCode);
}

export function composeProductSearchQuery(currentQuery: string, fragment: string): string {
  const current = currentQuery.trim().replace(/[\s,;:.]+$/g, '');
  const addition = fragment.trim().replace(/^[\s,;:.]+/g, '');

  if (!current) return addition;
  if (!addition) return current;
  return `${current}, ${addition}`;
}
