import type { Product, ProductAsset } from '@core/models/product/product';
import { ProductCondition } from '@core/models/product/product-condition';

export function imageFixture(id: string, isPrimary = false): ProductAsset {
  return {
    id,
    productId: 'desk',
    type: 'image',
    url: `https://example.test/${id}.webp`,
    isPrimary,
    metadata: {},
  };
}

export function productFixture(overrides: Partial<Product> = {}): Product {
  return {
    id: 'desk',
    sellerId: 'seller',
    categoryId: 'desks',
    title: 'Escritorio del vendedor',
    condition: ProductCondition.NEW,
    description: 'Descripción original del vendedor.',
    price: '999',
    stock: 9,
    createdAt: '',
    keywords: [],
    specifications: {
      dimensions: { width: 140, depth: 60, height: 75, unit: 'cm' },
      material: 'Roble macizo',
    },
    assets: [imageFixture('secondary'), imageFixture('primary', true)],
    category: {
      id: 'desks',
      code: 'DESK',
      name: 'Escritorios',
      parentId: null,
      description: '',
      imageUrl: '',
      level: 1,
    },
    listings: [
      { id: 'bo', marketCode: 'BO', price: '2450', currencyCode: 'BOB', stock: 2, isActive: true },
      {
        id: 'pe',
        marketCode: 'PE',
        price: '180.50',
        currencyCode: 'PEN',
        stock: 0,
        isActive: true,
      },
    ],
    ...overrides,
  };
}
