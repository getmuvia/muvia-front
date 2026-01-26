import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '@core/constants/api-endpoints';
import {
    HybridSearchRequest,
    HybridSearchResponse
} from '@core/models/search/hybrid-search.model';

/**
 * Default limits for hybrid search
 */
export const HYBRID_SEARCH_LIMITS = {
    MODAL: 10,       // Quick modal search
    PRODUCT_LIST: 20 // Full product list
} as const;

/**
 * HybridSearchService
 * Service for performing hybrid (semantic + lexical) search via AI endpoint.
 */
@Injectable({ providedIn: 'root' })
export class HybridSearchService {
    private readonly http = inject(HttpClient);

    /**
     * Performs a hybrid search (Semantic + Lexical) using Vertex AI.
     * 
     * @param query - The user's search term.
     * @param limit - Max number of results (defaults to Product List limit).
     * @returns Observable with search results including relevance probability.
     */
    search(query: string, limit: number = HYBRID_SEARCH_LIMITS.PRODUCT_LIST): Observable<HybridSearchResponse> {
        const payload: HybridSearchRequest = { query, limit };
        return this.http.post<HybridSearchResponse>(API_ENDPOINTS.AI.HYBRID_SEARCH, payload);
    }
}
