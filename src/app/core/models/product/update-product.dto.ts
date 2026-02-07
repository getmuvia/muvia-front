import { CreateProductSpecifications } from './create-product.dto';

/**
 * Asset for updating a product
 * - With id: existing asset (modify or keep)
 * - Without id: new asset (create)
 * - Excluded from array: asset will be deleted
 */
export interface UpdateProductAsset {
    id?: string;
    url: string;
    type: 'image' | 'model_3d';
    isPrimary?: boolean;
    metadata?: {
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
 * DTO for updating an existing product
 * All fields are optional since partial updates are allowed (PATCH)
 * Only include fields that need to be updated
 */
export interface UpdateProductDto {
    title?: string;
    description?: string;
    price?: number;
    stock?: number;
    categoryId?: string;
    specifications?: CreateProductSpecifications;
    keywords?: string[];
    assets?: UpdateProductAsset[];
}
