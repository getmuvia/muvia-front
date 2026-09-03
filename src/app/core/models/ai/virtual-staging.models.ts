export interface VirtualStagingRequest {
    imageKey: string;
    preferredStyle: string;
    maxProducts: number;
}

export interface VirtualStagingResponse {
    analysis: StagingAnalysis;
    suggestedProducts: StagingProduct[];
    stagedImageUrl: string;
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
    description: string;
    price: number;
    imageUrl: string;
    score: number;
    matchType: string;
}

export interface StagingMetadata {
    processingTimeMs: number;
    productsFound: number;
}
