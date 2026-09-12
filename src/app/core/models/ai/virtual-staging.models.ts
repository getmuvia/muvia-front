export interface VirtualStagingRequest {
    gcsStorageKey: string;
    productId: string;
    preferredStyle: string;
}

export interface VirtualStagingResponse {
    analysis: StagingAnalysis;
    selectedProduct: StagingProduct;
    stagedImageUrl: string;
    stagedImageExpiresAt: string;
    quota: VirtualStagingQuota;
    metadata: StagingMetadata;
}

export interface VirtualStagingQuota {
    limit: number;
    remaining: number;
}

export interface StagingAnalysis {
    roomType: string;
    style: string;
    emptyAreas: string[];
    suggestedFurniture: string[];
    colorPalette: string[];
}

export interface StagingProduct {
    id: string;
    title: string;
    description: string | null;
    price: number;
    imageUrl: string;
}

export interface StagingMetadata {
    processingTimeMs: number;
    productsFound: number;
}
