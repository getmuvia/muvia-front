import { computed } from '@angular/core';
import { signalStoreFeature, withState, withComputed, withMethods, patchState } from '@ngrx/signals';

export interface PaginationState {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface PaginatedResult {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

const initialPaginationState: PaginationState = {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
};

/**
 * SignalStore Feature for managing pagination state.
 * Adds signals: `page`, `limit`, `total`, `totalPages`.
 * Adds computed: `hasNextPage`, `hasPrevPage`.
 * Adds methods: `setPagination`, `goToPage`, `nextPage`, `prevPage`, `updateLimit`.
 */
export function withPagination() {
    return signalStoreFeature(
        withState<PaginationState>(initialPaginationState),

        withComputed(({ page, limit, total, totalPages }) => ({
            hasNextPage: computed(() => page() < totalPages()),
            hasPrevPage: computed(() => page() > 1),
            paginationState: computed(() => ({
                page: page(),
                limit: limit(),
                total: total(),
                totalPages: totalPages(),
            })),
        })),

        withMethods((store) => ({
            
            /** Updates the full pagination state from an API response */
            setPagination(result: PaginatedResult) {
                patchState(store, {
                    page: result.page,
                    limit: result.limit,
                    total: result.total,
                    totalPages: result.totalPages,
                });
            },

            /** Navigates to a specific page number */
            goToPage(page: number) {
                patchState(store, { page });
            },

            /** Increments the page number if next page exists */
            nextPage() {
                const current = store.page();
                if (current < store.totalPages()) {
                    patchState(store, { page: current + 1 });
                }
            },

            /** Decrements the page number if previous page exists */
            prevPage() {
                const current = store.page();
                if (current > 1) {
                    patchState(store, { page: current - 1 });
                }
            },

            /** Updates the limit per page and resets to page 1 */
            updateLimit(limit: number) {
                patchState(store, { limit, page: 1 });
            }
        }))
    );
}
