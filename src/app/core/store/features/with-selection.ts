import { computed } from '@angular/core';
import { signalStoreFeature, withState, withComputed, withMethods, patchState } from '@ngrx/signals';

export interface EntitySelectionState<T> {
    selectedEntity: T | null;
    selectedId: string | number | null;
}

const initialSelectionState: EntitySelectionState<any> = {
    selectedEntity: null,
    selectedId: null,
};

/**
 * SignalStore Feature for managing single entity selection.
 * Adds signals: `selectedEntity`, `selectedId`.
 * Adds computed: `hasSelection`.
 * Adds methods: `selectEntity`, `selectId`, `clearSelection`.
 */
export function withEntitySelection<T>() {
    return signalStoreFeature(
        withState<EntitySelectionState<T>>(initialSelectionState),

        withComputed(({ selectedEntity, selectedId }) => ({
            hasSelection: computed(() => !!selectedEntity() || !!selectedId()),
        })),
        
        withMethods((store) => ({

            /** Selects an entity object and attempts to infer its ID */
            selectEntity(entity: T) {
                patchState(store, {
                    selectedEntity: entity,
                    selectedId: (entity as any)?.id || null
                } as Partial<EntitySelectionState<T>>);
            },

            /** Selects an entity by ID, clearing any selected entity object */
            selectId(id: string | number) {
                patchState(store, { selectedId: id, selectedEntity: null } as Partial<EntitySelectionState<T>>);
            },

            /** Clears the current selection */
            clearSelection() {
                patchState(store, initialSelectionState);
            }
        }))
    );
}
