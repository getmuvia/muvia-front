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
            // Actualiza todo el estado de paginación basado en la respuesta de la API
            setPagination(result: PaginatedResult) {
                patchState(store, {
                    page: result.page,
                    limit: result.limit,
                    total: result.total,
                    totalPages: result.totalPages,
                });
            },

            // Helpers de navegación
            goToPage(page: number) {
                patchState(store, { page });
            },

            nextPage() {
                const current = store.page();
                if (current < store.totalPages()) {
                    patchState(store, { page: current + 1 });
                }
            },

            prevPage() {
                const current = store.page();
                if (current > 1) {
                    patchState(store, { page: current - 1 });
                }
            },

            updateLimit(limit: number) {
                patchState(store, { limit, page: 1 }); // Reiniciar a pág 1 al cambiar límite
            }
        }))
    );
}
