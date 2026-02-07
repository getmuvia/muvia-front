import { Product } from '@core/models/product/product';
import { ProductFormData } from '@core/models/product/product-form.model';
import { CreateProductDto, CreateProductSpecifications, CreateProductAsset } from '@core/models/product/create-product.dto';
import { UpdateProductDto, UpdateProductAsset } from '@core/models/product/update-product.dto';

/**
 * Maps a Product entity to ProductFormData for form population
 */
export function mapProductToFormData(product: Product): ProductFormData {
    const dimensions = product.specifications?.dimensions;

    return {
        title: product.title,
        description: product.description,
        price: parseFloat(product.price),
        stock: product.stock,
        categoryId: product.categoryId,
        weight: product.specifications?.weight || '',
        material: product.specifications?.material || '',
        color: product.specifications?.color || '',
        dimensionWidth: dimensions?.width || 0,
        dimensionHeight: dimensions?.height || 0,
        dimensionDepth: dimensions?.depth || 0,
        dimensionUnit: dimensions?.unit || 'cm'
    };
}

/**
 * Builds specifications object from form values
 */
function buildSpecifications(formValue: ProductFormData): CreateProductSpecifications {
    return {
        weight: formValue.weight,
        material: formValue.material,
        color: formValue.color,
        dimensions: {
            width: formValue.dimensionWidth,
            height: formValue.dimensionHeight,
            depth: formValue.dimensionDepth,
            unit: formValue.dimensionUnit
        }
    };
}

/**
 * Builds CreateProductDto for new products
 */
export function buildCreateDto(
    formValue: ProductFormData,
    keywords: string[],
    allAssets: CreateProductAsset[]
): CreateProductDto {
    return {
        title: formValue.title,
        description: formValue.description,
        price: formValue.price,
        stock: formValue.stock,
        categoryId: formValue.categoryId,
        specifications: buildSpecifications(formValue),
        keywords,
        assets: allAssets
    };
}

/**
 * Builds UpdateProductDto for editing products
 */
export function buildUpdateDto(
    formValue: ProductFormData,
    keywords: string[],
    assets?: UpdateProductAsset[]
): UpdateProductDto {
    const dto: UpdateProductDto = {
        title: formValue.title,
        description: formValue.description,
        price: formValue.price,
        stock: formValue.stock,
        categoryId: formValue.categoryId,
        specifications: buildSpecifications(formValue),
        keywords
    };

    if (assets) {
        dto.assets = assets;
    }

    return dto;
}
