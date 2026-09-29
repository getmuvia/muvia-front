# Hybrid Search Documentation

## Overview
The "Smart Search" feature implements a **Hybrid Search** strategy, combining:
1.  **Semantic Search**: Understanding user intent (e.g., "mesa de madera" finds wooden tables even without exact keyword match).
2.  **Lexical Search**: Exact keyword matching for precision (e.g., SKU numbers or specific model names).

## Architecture

### 1. Frontend Components
-   **`SmartSearchModal`** (`features/shop/components/modals/smart-search`):
    -   The main entry point for user search in the Navbar.
    -   Implements "Type-ahead" search using the shared debounce configuration.
    -   Displays rich results and a compact read-only interpretation.
    -   Handles keyboard navigation (Arrows, Enter).

-   **`ProductList`** (`features/shop/product/product-list`):
    -   The results page.
    -   Subscribes to URL query params (`?search=foo`) to synchronize state.
    -   Adds explicitly submitted details to the current natural-language context.
    -   Owns the interpretation returned for the current completed request.
    -   **Important**: Manages the switch between AI and SQL search modes.

-   **`SearchInterpretation`** (`features/shop/search-interpretation`):
    -   Presentational standalone component for **Muvia entendió**.
    -   Receives typed data through signal inputs and emits a corrected natural-language query.
    -   Does not inject the router or the API service.
    -   Supports a compact read-only mode for the navbar search modal.

### 2. Service Layer
-   **`HybridSearchService`** (`core/services/search/hybrid-search.ts`):
    -   Singleton service responsible for communicating with the Backend AI endpoint.
    -   Endpoint: `API_ENDPOINTS.AI.HYBRID_SEARCH`

### 3. Data Flow
1.  User types "Sillon".
2.  The navbar modal waits for the shared `SEARCH_INPUT_CONFIG.DEBOUNCE_MS`
    interval; the catalog page waits for Enter or a click on the search button.
3.  `HybridSearchService` sends POST request to Backend.
4.  Backend (Vertex AI + PostgreSQL pgvector):
    -   Resolves and validates the buyer intent.
    -   Generates Embedding (Vector) for "Sillon".
    -   Queries database for similar vectors (Cosine Similarity).
    -   Ranks direct matches before partial material matches.
    -   Returns same-category products without the requested material as separate fallback suggestions.
5.  Frontend displays **Muvia entendió**, direct matches, and fallback
    suggestions under **Otros productos que te podrían interesar**.

## Contextual search flow

The catalog input collects one explicit fragment at a time. It never submits
because the buyer paused while typing:

1. The buyer enters `quiero un escritorio` and submits with Enter or the search button.
2. `ProductList` stores that complete context in the `search` URL parameter.
3. The input is cleared while the submitted context remains visible as the active search.
4. The buyer enters `que sea de madera` and submits again.
5. `ProductList` combines both fragments as
   `quiero un escritorio, que sea de madera` and updates the URL.
6. The route subscription performs one search with the accumulated query.

The navbar modal remains a debounced type-ahead surface. Context accumulation
belongs only to the full catalog page.

## Interpretation refinement flow

The buyer corrects the original phrase rather than manipulating category,
material or measurement controls:

1. `ProductList` renders the validated interpretation returned by the backend.
2. The buyer selects **Ajustar búsqueda**.
3. `SearchInterpretation` emits the normalized corrected phrase.
4. `ProductList` writes the phrase to the `search` URL query parameter.
5. The existing route subscription performs one new hybrid search.
6. The previous interpretation is cleared while the request is pending and is
   replaced only when the new response succeeds.

This keeps the URL as the navigation source of truth and avoids introducing a
second request path inside the presentational component. Structured chip editing
would require an explicit backend override contract and is intentionally outside
the current frontend behavior.

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
