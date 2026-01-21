import { computed } from '@angular/core';
import { signalStoreFeature, withState, withComputed } from '@ngrx/signals';

export type RequestStatus = 'idle' | 'loading' | 'success' | 'error';

export function withRequestStatus() {
    return signalStoreFeature(
        withState<{ requestStatus: RequestStatus; error: string | null }>({
            requestStatus: 'idle',
            error: null,
        }),
        withComputed(({ requestStatus }) => ({
            isLoading: computed(() => requestStatus() === 'loading'),
            isLoaded: computed(() => requestStatus() === 'success'),
            isError: computed(() => requestStatus() === 'error'),
        }))
    );
}

export function setLoading(): { requestStatus: RequestStatus; error: null } {
    return { requestStatus: 'loading', error: null };
}

export function setLoaded(): { requestStatus: RequestStatus; error: null } {
    return { requestStatus: 'success', error: null };
}

export function setError(error: string): { requestStatus: RequestStatus; error: string } {
    return { requestStatus: 'error', error };
}
