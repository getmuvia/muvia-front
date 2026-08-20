import { Product, ProductAsset } from '@core/models/product/product';
import { CreateProductAsset } from '@core/models/product/create-product.dto';
import { UpdateProductAsset } from '@core/models/product/update-product.dto';

/**
 * Extracts image assets from a product
 */
export function extractImageAssets(product: Product): CreateProductAsset[] {
    return product.assets
        .filter(a => a.type === 'image')
        .map(a => ({
            url: a.url,
            type: 'image' as const,
            isPrimary: a.isPrimary,
            metadata: a.metadata || {}
        }));
}

/**
 * Extracts 3D model asset by format
 */
export function extract3dAsset(product: Product, format: 'glb' | 'usdz'): CreateProductAsset | null {
    const asset = product.assets.find(
        a => a.type === 'model_3d' && matchesModelFormat(a.metadata?.['format'], format)
    );

    if (!asset) return null;

    return {
        url: asset.url,
        type: 'model_3d',
        isPrimary: false,
        metadata: asset.metadata || {}
    };
}

/**
 * Checks if assets have changed compared to original
 */
export function checkAssetsChanged(
    originalAssets: ProductAsset[],
    currentAssets: CreateProductAsset[],
    pendingUploadsCount: number
): boolean {
    if (pendingUploadsCount > 0) return true;
    if (originalAssets.length !== currentAssets.length) return true;

    return originalAssets.some(original => {
        const current = currentAssets.find(asset => asset.url === original.url);
        return !current
            || current.type !== original.type
            || current.isPrimary !== original.isPrimary
            || current.metadata?.['format'] !== original.metadata?.['format'];
    });
}

/**
 * Builds assets array for update with proper ID mapping
 */
export function buildAssetsForUpdate(
    imageAssets: CreateProductAsset[],
    glbAsset: CreateProductAsset | null,
    usdzAsset: CreateProductAsset | null,
    originalAssets: ProductAsset[]
): UpdateProductAsset[] {
    const assets: UpdateProductAsset[] = [];

    // Map image assets
    for (const asset of imageAssets) {
        const original = originalAssets.find(o => o.url === asset.url);
        assets.push({
            id: original?.id,
            url: asset.url,
            type: asset.type,
            isPrimary: asset.isPrimary,
            metadata: asset.metadata
        });
    }

    // Map GLB model
    if (glbAsset) {
        const originalGlb = originalAssets.find(
            o => o.type === 'model_3d' && matchesModelFormat(o.metadata?.['format'], 'glb')
        );
        assets.push({
            id: originalGlb?.id,
            url: glbAsset.url,
            type: glbAsset.type,
            isPrimary: glbAsset.isPrimary,
            metadata: glbAsset.metadata
        });
    }

    // Map USDZ model
    if (usdzAsset) {
        const originalUsdz = originalAssets.find(
            o => o.type === 'model_3d' && o.metadata?.['format'] === 'usdz'
        );
        assets.push({
            id: originalUsdz?.id,
            url: usdzAsset.url,
            type: usdzAsset.type,
            isPrimary: usdzAsset.isPrimary,
            metadata: usdzAsset.metadata
        });
    }

    return assets;
}

/**
 * Combines all assets into a single array
 */
export function combineAssets(
    imageAssets: CreateProductAsset[],
    glbAsset: CreateProductAsset | null,
    usdzAsset: CreateProductAsset | null
): CreateProductAsset[] {
    const assets = [...imageAssets];
    if (glbAsset) assets.push(glbAsset);
    if (usdzAsset) assets.push(usdzAsset);
    return assets;
}

function matchesModelFormat(value: unknown, expected: 'glb' | 'usdz'): boolean {
    return expected === 'glb'
        ? value === 'glb' || value === 'gltf'
        : value === 'usdz';
}
