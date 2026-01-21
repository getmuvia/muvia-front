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

export function withEntitySelection<T>() {
    return signalStoreFeature(
        withState<EntitySelectionState<T>>(initialSelectionState),
        withComputed(({ selectedEntity, selectedId }) => ({
            hasSelection: computed(() => !!selectedEntity() || !!selectedId()),
        })),
        withMethods((store) => ({
            selectEntity(entity: T) {
                patchState(store, {
                    selectedEntity: entity,
                    selectedId: (entity as any)?.id || null
                } as Partial<EntitySelectionState<T>>);
            },
            selectId(id: string | number) {
                patchState(store, { selectedId: id, selectedEntity: null } as Partial<EntitySelectionState<T>>);
            },
            clearSelection() {
                patchState(store, initialSelectionState);
            }
        }))
    );
}
