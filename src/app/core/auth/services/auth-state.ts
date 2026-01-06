import { signal, computed, Injectable } from '@angular/core';
import { User } from '../models/auth.models';

@Injectable({
    providedIn: 'root'
})
export class AuthState {
    private readonly _currentUser = signal<User | null>(null);
    private readonly _loading = signal<boolean>(false);
    private readonly _error = signal<string | null>(null);

    readonly currentUser = this._currentUser.asReadonly();
    readonly isAuthenticated = computed(() => this._currentUser() !== null);
    readonly isLoading = this._loading.asReadonly();
    readonly error = this._error.asReadonly();

    /**
     * Sets the current user.
     */
    setUser(user: User | null): void {
        this._currentUser.set(user);
    }

    /**
     * Sets the loading state.
     */
    setLoading(loading: boolean): void {
        this._loading.set(loading);
    }

    /**
     * Sets an error message.
     */
    setError(error: string | null): void {
        this._error.set(error);
    }

    /**
     * Clears the error state.
     */
    clearError(): void {
        this._error.set(null);
    }

    /**
     * Resets all state (for logout).
     */
    reset(): void {
        this._currentUser.set(null);
        this._loading.set(false);
        this._error.set(null);
    }
}
