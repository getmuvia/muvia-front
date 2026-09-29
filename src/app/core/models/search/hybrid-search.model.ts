/**
 * Hybrid Search Types
 * For the /ai/hybrid endpoint
 */

/**
 * Match type indicating how the result was found
 */
export type MatchType = 'hybrid' | 'semantic' | 'lexical';

/** Source used by the backend to resolve the validated search intent. */
export type SearchInterpretationSource = 'ai' | 'deterministic';

/** Product dimension recognized in a natural-language search. */
export type SearchMeasurementDimension = 'width' | 'height' | 'depth';

/** Buyer-facing explanation of the intent applied to a hybrid search. */
export interface HybridSearchInterpretation {
    summary: string;
    source: SearchInterpretationSource;
    category?: {
        code: string;
        label: string;
    };
    material?: {
        code: string;
        label: string;
    };
    measurement?: {
        dimension: SearchMeasurementDimension;
        maxDimensionCm: number;
    };
}

/**
 * Request payload for hybrid search
 */
export interface HybridSearchRequest {
    query: string;
    limit?: number;
    marketCode?: string;
    locale?: string;
}

/**
 * Single result from hybrid search
 */
export interface HybridSearchResult {
    id: string;
    title: string;
    description: string | null;
    price: number;
    currencyCode: string;
    imageUrl: string | null;
    score: number;
    matchType: MatchType;
}

/**
 * Response from the hybrid search endpoint
 */
export interface HybridSearchResponse {
    query: string;
    interpretation: HybridSearchInterpretation;
    results: HybridSearchResult[];
    count: number;
    /** Fallback and broader suggestions supplied separately by the backend. */
    relatedResults?: HybridSearchResult[];
}
