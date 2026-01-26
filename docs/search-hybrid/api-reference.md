# API Reference: Hybrid Search

## Endpoint
`POST /api/ai/hybrid-search`

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
    results: HybridSearchResult[];
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
