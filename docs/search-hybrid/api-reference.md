# API Reference: Hybrid Search

## Endpoint
`POST /ai/hybrid`

### Request Body
```typescript
interface HybridSearchRequest {
    query: string; // The search term
    limit: number; // Max results (Modal: 10, List: 20)
    marketCode: string;
    locale: string;
}
```

### Response Body
```typescript
interface HybridSearchResponse {
    query: string;
    interpretation: HybridSearchInterpretation;
    results: HybridSearchResult[];
    count: number;
    relatedResults: HybridSearchResult[];
}

interface HybridSearchInterpretation {
    summary: string;
    source: 'ai' | 'deterministic';
    category?: {
        code: string;
        label: string;
    };
    material?: {
        code: string;
        label: string;
    };
    measurement?: {
        dimension: 'width' | 'height' | 'depth';
        maxDimensionCm: number;
    };
}

interface HybridSearchResult {
    id: string;
    title: string;
    description: string;
    price: number;
    imageUrl: string;
    score: number;      // Relevance probability (0-1)
    matchType: string;  // 'semantic', 'lexical', 'hybrid'
}
```

`results` contains direct matches ordered by product type, requested material
and hybrid relevance. `relatedResults` contains fallback suggestions and is
rendered separately at the end of `/products`.

`interpretation` is the validated buyer-facing intent applied by the backend.
The UI displays `summary` but does not expose the technical `source` value or
present the structured fields as traditional filters.
