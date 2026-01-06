import { ProductDimensions } from './product';

/**
 * Asset to be uploaded with the product
 */
export interface CreateProductAsset {
    url: string;
    type: 'image' | 'model_3d';
    isPrimary: boolean;
    metadata: {
        alt?: string;
        width?: number;
        height?: number;
        scale?: string;
        arPlacement?: string;
        format?: string;
        [key: string]: unknown;
    };
}

/**
 * Specifications for creating a product
 */
export interface CreateProductSpecifications {
    weight?: string;
    dimensions?: ProductDimensions;
    material?: string;
    color?: string;
}

/**
 * DTO for creating a new product
 */
export interface CreateProductDto {
    title: string;
    description: string;
    price: number;
    stock: number;
    categoryId: string;
    specifications: CreateProductSpecifications;
    keywords: string[];
    assets: CreateProductAsset[];
}
