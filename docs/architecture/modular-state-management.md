# Modular State Management with NgRx SignalStore

## Introduction
This document details the state management architecture implemented in the `itera-front` project. We have migrated from traditional services and monolithic stores to a **Modular Feature-based Architecture** using `@ngrx/signals`.

## Why NgRx SignalStore?
We chose NgRx SignalStore over traditional NgRx (Store/Effects) or plain RxJS Services for several key reasons:

1.  **Granular Reactivity**: Signals provide fine-grained reactivity. Unlike Observables which often require distinctUntilChanged() or complex stream management, Signals only trigger updates when values actually change, optimizing change detection in Angular 21+.
2.  **Boilerplate Reduction**: Traditional NgRx requires Actions, Reducers, Selectors, and Effects files. SignalStore colocates state, computed values, and methods in a single, cohesive unit whilte retaining scalability.
3.  **Type Safety & Inference**: TypeScript inference works exceptionally well with SignalStore, reducing the need for manual type arguments compared to generic Service subjects.
4.  **Declarative Features**: The "Custom Features" pattern (which this architecture heavily relies on) allows us to write logic once (like Pagination) and plug it into any store, essentially creating a "composition over inheritance" model for state.

## Core Architecture
Reusable state logic is centralized in `src/app/core/store/features/`.

### 1. Feature: `withRequestStatus`
**Path**: `src/app/core/store/features/with-request-status.ts`

Standardizes the lifecycle of asynchronous requests.
- **State**: `requestStatus` ('idle' | 'loading' | 'success' | 'error') and `error` (string).
- **Computed**: `isLoading()`, `isLoaded()`, `isError()`.
- **Helpers**: `setLoading()`, `setLoaded()`, `setError(msg)`.

**Usage Pattern**:
Instead of manually toggling booleans, we simply patch the state with these helpers within our RxJS pipes (`tapResponse`).

### 2. Feature: `withPagination`
**Path**: `src/app/core/store/features/with-pagination.ts`

Centralizes pagination logic for tables and infinite lists.
- **State**: `page`, `limit`, `total`, `totalPages`.
- **Methods**: `setPagination(response)`, `nextPage()`, `prevPage()`, `goToPage(n)`.

**Global Config**:
Defaults are sourced from `src/app/core/store/store.config.ts` to ensure consistency across the app.

### 3. Feature: `withEntitySelection`
**Path**: `src/app/core/store/features/with-selection.ts`

Manages the logic for selecting a single item from a collection (e.g., for detailed views or editing).
- **State**: `selectedEntity` (T | null), `selectedId`.
- **Methods**: `selectEntity(entity)`, `selectId(id)`, `clearSelection()`.

---

## Implementation Example: ProductStore
The `ProductStore` (`src/app/core/services/product/product.ts`) demonstrates this architecture.

**Monolithic Approach (Legacy)**:
The service manually managed `isLoading`, `totalItems`, `selectedProduct` and repeated error handling logic in every method.

**Modular Approach (Current)**:
```typescript
export const ProductStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  
  withRequestStatus(),
  withPagination(),
  withEntitySelection<Product>(),

  withMethods(...)
);
```
