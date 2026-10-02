import { HybridSearchResult } from '@core/models/search/hybrid-search.model';
import { mapSearchResultToSummary } from './product-search-result';

describe('Search result summary', () => {
  const result: HybridSearchResult = {
    id: 'desk', title: 'Escritorio', description: null, price: 235.5, currencyCode: 'PEN',
    imageUrl: 'https://example.com/desk.webp', score: 0.8, matchType: 'hybrid',
  };

  it('preserves pricing, image and relevance without fabricating detail fields', () => {
    expect(mapSearchResultToSummary(result)).toEqual({
      id: 'desk', title: 'Escritorio', price: 235.5, currencyCode: 'PEN', category: null,
      primaryImage: { url: 'https://example.com/desk.webp', alt: null }, score: 0.8, matchType: 'hybrid',
    });
  });

  it('represents a missing image and category explicitly', () => {
    const summary = mapSearchResultToSummary({ ...result, imageUrl: null, matchType: 'lexical' });
    expect(summary.primaryImage).toBeNull();
    expect(summary.category).toBeNull();
    expect(summary.matchType).toBe('lexical');
    expect(summary).not.toHaveProperty('stock');
    expect(summary).not.toHaveProperty('sellerId');
    expect(summary).not.toHaveProperty('assets');
    expect(summary).not.toHaveProperty('createdAt');
  });
});
