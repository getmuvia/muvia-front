import { Product } from '@core/models/product/product';
import { HybridSearchResult } from '@core/models/search/hybrid-search.model';

export type SearchProduct = Product & Pick<HybridSearchResult, 'score' | 'matchType'>;

/** Adapts hybrid results to the existing product preview contract. */
export function mapSearchResultToProduct(result: HybridSearchResult): SearchProduct {
  return {
    id: result.id,
    sellerId: '',
    categoryId: '',
    title: result.title,
    description: result.description ?? '',
    score: result.score,
    matchType: result.matchType,
    price: result.price.toString(),
    stock: 0,
    specifications: {},
    keywords: [],
    createdAt: '',
    assets: result.imageUrl ? [{
      id: '',
      productId: result.id,
      url: result.imageUrl,
      type: 'image',
      isPrimary: true,
      metadata: {},
    }] : [],
    category: {
      id: '',
      parentId: null,
      name: '',
      description: '',
      imageUrl: '',
      level: 0,
    },
  };
}
