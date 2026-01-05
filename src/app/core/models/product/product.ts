/**
 * Product specifications with dimensions
 */
export interface ProductDimensions {
  width: number;
  height: number;
  depth: number;
  unit: string;
}

export interface ProductSpecifications {
  weight?: string;
  dimensions?: ProductDimensions;
  material?: string;
  color?: string;
  [key: string]: unknown;
}

/**
 * Asset metadata for images
 */
export interface AssetMetadata {
  alt?: string;
  [key: string]: unknown;
}

/**
 * Asset associated with a product
 */
export interface ProductAsset {
  id: string;
  productId: string;
  url: string;
  type: string;
  isPrimary: boolean;
  metadata: AssetMetadata;
}

/**
 * Category associated with a product
 */
export interface ProductCategory {
  id: string;
  parentId: string | null;
  name: string;
  description: string;
  imageUrl: string;
  level: number;
}

/**
 * Product from the backend API
 */
export interface Product {
  id: string;
  sellerId: string;
  categoryId: string;
  title: string;
  description: string;
  price: string;
  stock: number;
  specifications: ProductSpecifications;
  keywords: string[];
  createdAt: string;
  assets: ProductAsset[];
  category: ProductCategory;
}
