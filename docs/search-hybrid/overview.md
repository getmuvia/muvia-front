# Hybrid Search Documentation

## Overview
The "Smart Search" feature implements a **Hybrid Search** strategy, combining:
1.  **Semantic Search**: Understanding user intent (e.g., "mesa de madera" finds wooden tables even without exact keyword match).
2.  **Lexical Search**: Exact keyword matching for precision (e.g., SKU numbers or specific model names).

## Architecture

### 1. Frontend Components
-   **`SmartSearchModal`** (`features/shop/components/modals/smart-search`):
    -   The main entry point for user search in the Navbar.
    -   Implements "Type-ahead" (instant) search with a **600ms debounce**.
    -   Displays rich results with images and relevance scores.
    -   Handles keyboard navigation (Arrows, Enter).

-   **`ProductList`** (`features/shop/product/product-list`):
    -   The results page.
    -   Subscribes to URL query params (`?search=foo`) to synchronize state.
    -   **Important**: Manages the switch between AI and SQL search modes.

### 2. Service Layer
-   **`HybridSearchService`** (`core/services/search/hybrid-search.ts`):
    -   Singleton service responsible for communicating with the Backend AI endpoint.
    -   Endpoint: `API_ENDPOINTS.AI.HYBRID_SEARCH`

### 3. Data Flow
1.  User types "Sillon".
2.  Frontend waits 600ms (Debounce).
3.  `HybridSearchService` sends POST request to Backend.
4.  Backend (Vertex AI + PostgreSQL pgvector):
    -   Generates Embedding (Vector) for "Sillon".
    -   Queries database for similar vectors (Cosine Similarity).
    -   Returns ranked results.
5.  Frontend displays results.

## Key Logic Decisions

### ⛔ Mutually Exclusive Execution (Hybrid vs SQL)
The application **NEVER** executes both searches simultaneously. A strict conditional branching is applied in `ProductList.searchProducts()` based on query length:

| Query Condition | Mode Activated | Service Called | Reason |
| :--- | :--- | :--- | :--- |
| **Length < 2** | **SQL Standard** | `store.searchProducts()` | Efficient for listing all products or filtering by category without text. Avoids wasting AI tokens on empty/short strings. |
| **Length >= 2** | **AI Hybrid** | `hybridSearchService.search()` | Activates Semantic + Lexical search. The backend handles the hybrid merging, so we do **NOT** need to call SQL separately. |

**Justification:**
-   **Performance**: Prevents redundant API calls.
-   **Cost**: Reduces Vertex AI costs by not embedding short/empty queries.
-   **Consistency**: Avoids result duplication (merging SQL + Hybrid results manually is prone to errors).

### Race Condition Handling
In `SmartSearchModal`, we use a specific pattern to prevent race conditions when pressing Enter:
```typescript
this.router.navigate(['/products']).then(() => this.onClose());
```
We *must* wait for the navigation promise to resolve before destroying the modal component.

### URL Synchronization
`ProductList` does not rely on `snapshot`. It subscribes to `route.queryParamMap` to support searching *while already on the results page*.
