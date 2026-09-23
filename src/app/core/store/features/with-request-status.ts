import { computed } from '@angular/core';
import { signalStoreFeature, withState, withComputed } from '@ngrx/signals';

export type RequestStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * SignalStore Feature for managing asynchronous request state.
 * Adds signals: `requestStatus` and `error`.
 * Adds computed signals: `isLoading`, `isLoaded`, `isError`.
 */
export function withRequestStatus<TError = string>() {
    return signalStoreFeature(
        withState<{ requestStatus: RequestStatus; error: TError | null }>({
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

/** Helper to set state to Loading */
export function setLoading(): { requestStatus: RequestStatus; error: null } {
    return { requestStatus: 'loading', error: null };
}

/** Helper to set state to Success/Loaded */
export function setLoaded(): { requestStatus: RequestStatus; error: null } {
    return { requestStatus: 'success', error: null };
}

/** Helper to set state to Error while preserving its typed value. */
export function setError<TError>(error: TError): { requestStatus: RequestStatus; error: TError } {
    return { requestStatus: 'error', error };
}
