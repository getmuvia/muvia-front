# API Reference: Hybrid Search

## Endpoint
`POST /ai/hybrid`

### Request Body
```typescript
interface HybridSearchRequest {
    query: string; // The search term
    limit: number; // Max results (Modal: 10, List: 20)
}
```

### Response Body
```typescript
interface HybridSearchResponse {
    query: string;
    results: HybridSearchResult[];
    count: number;
    relatedResults: HybridSearchResult[];
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
