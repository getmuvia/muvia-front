/**
 * Hybrid Search Types
 * For the /ai/hybrid endpoint
 */

/**
 * Match type indicating how the result was found
 */
export type MatchType = 'hybrid' | 'semantic' | 'lexical';

/**
 * Request payload for hybrid search
 */
export interface HybridSearchRequest {
    query: string;
    limit?: number;
}

/**
 * Single result from hybrid search
 */
export interface HybridSearchResult {
    id: string;
    title: string;
    description: string;
    price: number;
    imageUrl: string;
    score: number;
    matchType: MatchType;
}

/**
 * Response from the hybrid search endpoint
 */
export interface HybridSearchResponse {
    query: string;
    results: HybridSearchResult[];
    count: number;
}
