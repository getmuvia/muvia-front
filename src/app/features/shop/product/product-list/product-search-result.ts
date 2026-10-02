import { ProductSummary } from '@core/models/product/product-summary';
import { HybridSearchResult } from '@core/models/search/hybrid-search.model';

export type SearchProductSummary = ProductSummary & Pick<HybridSearchResult, 'score' | 'matchType'>;

/** Search results contain preview data, not the full product detail. */
export function mapSearchResultToSummary(result: HybridSearchResult): SearchProductSummary {
  return {
    id: result.id,
    title: result.title,
    price: result.price,
    currencyCode: result.currencyCode,
    category: null,
    primaryImage: result.imageUrl ? { url: result.imageUrl, alt: null } : null,
    score: result.score,
    matchType: result.matchType,
  };
}
