import { Product, ProductListing } from './product';
import { ProductSummary } from './product-summary';
import { resolveProductPrice } from './product-price';

describe('Product price resolution', () => {
  const bolivia: ProductListing = {
    id: 'bo-listing', marketCode: 'BO', price: '100', currencyCode: 'BOB', stock: 1, isActive: true,
  };
  const peru: ProductListing = {
    id: 'pe-listing', marketCode: 'PE', price: '180.50', currencyCode: 'PEN', stock: 1, isActive: true,
  };
  const product: Product = {
    id: 'product', sellerId: 'seller', categoryId: 'category', title: 'Escritorio',
    description: '', price: '999', stock: 1, specifications: {}, keywords: [], createdAt: '', assets: [],
    category: { id: 'category', name: 'Escritorios', parentId: null, description: '', imageUrl: '', level: 1 },
    listings: [bolivia, peru],
  };

  it('preserves the amount and explicit currency of a summary regardless of the current market', () => {
    const summary: ProductSummary = {
      id: 'summary', title: 'Escritorio', price: 12.5, currencyCode: 'USD', category: null, primaryImage: null,
    };
    expect(resolveProductPrice(summary, 'PE')).toEqual({ amount: 12.5, currencyCode: 'USD' });
  });

  it('uses the selected market listing instead of relabeling the legacy amount', () => {
    expect(resolveProductPrice(product, 'PE')).toEqual({ amount: 180.5, currencyCode: 'PEN' });
    expect(resolveProductPrice(product, 'BO')).toEqual({ amount: 100, currencyCode: 'BOB' });
  });

  it('keeps an available listing amount and currency together when the selected market has none', () => {
    expect(resolveProductPrice(product, 'US')).toEqual({ amount: 100, currencyCode: 'BOB' });
  });

  it('prefers active pricing over an inactive listing for the selected market', () => {
    expect(resolveProductPrice({ ...product, listings: [bolivia, { ...peru, isActive: false }] }, 'PE'))
      .toEqual({ amount: 100, currencyCode: 'BOB' });
  });

  it('uses known listing currency even when all listings are inactive', () => {
    expect(resolveProductPrice({
      ...product, listings: [{ ...bolivia, isActive: false }, { ...peru, isActive: false }],
    }, 'PE')).toEqual({ amount: 180.5, currencyCode: 'PEN' });
  });

  it('preserves Bolivia pricing for the legacy product contract without listings', () => {
    expect(resolveProductPrice({ ...product, listings: undefined }, 'PE'))
      .toEqual({ amount: 999, currencyCode: 'BOB' });
  });
});
