import { Injectable, signal, computed } from '@angular/core';
import { User, LoginData  , RegisterData, AuthResponse } from '../models/auth.models';

/**
 * AuthService handles authentication state and operations.
 * Uses Angular 21 signals for reactive state management.
 */
@Injectable({
    providedIn: 'root'
})
export class AuthService {
    // Private signals for state management
    private readonly currentUserSignal = signal<User | null>(null);
    private readonly loadingSignal = signal<boolean>(false);
    private readonly errorSignal = signal<string | null>(null);

    // Public readonly computed signals
    readonly currentUser = this.currentUserSignal.asReadonly();
    readonly isAuthenticated = computed(() => this.currentUserSignal() !== null);
    readonly isLoading = this.loadingSignal.asReadonly();
    readonly error = this.errorSignal.asReadonly();

    constructor() {
        // TODO: Check for existing session on initialization
        this.checkStoredSession();
    }

    /**
     * Attempts to login with provided credentials.
     * Currently a stub - will integrate with backend API.
     */
    async login(credentials: LoginData): Promise<boolean> {
        this.loadingSignal.set(true);
        this.errorSignal.set(null);

        try {
            // TODO: Replace with actual API call
            // const response = await this.http.post<AuthResponse>('/api/auth/login', credentials);

            // Simulated delay for UI feedback
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Simulated success (for UI testing only)
            console.log('Login attempt with:', credentials.email);

            // TODO: Set user from response
            // this.currentUserSignal.set(response.user);
            // this.storeSession(response);

            return true;
        } catch (error: any) {
            this.errorSignal.set(error?.message || 'Error al iniciar sesión');
            return false;
        } finally {
            this.loadingSignal.set(false);
        }
    }

    /**
     * Registers a new user with provided data.
     * Currently a stub - will integrate with backend API.
     */
    async register(data: RegisterData): Promise<boolean> {
        this.loadingSignal.set(true);
        this.errorSignal.set(null);

        try {
            // TODO: Replace with actual API call
            // const response = await this.http.post<AuthResponse>('/api/auth/register', data);

            // Simulated delay for UI feedback
            await new Promise(resolve => setTimeout(resolve, 1000));

            console.log('Register attempt with:', data.email);

            return true;
        } catch (error: any) {
            this.errorSignal.set(error?.message || 'Error al registrarse');
            return false;
        } finally {
            this.loadingSignal.set(false);
        }
    }

    /**
     * Logs out the current user.
     */
    logout(): void {
        this.currentUserSignal.set(null);
        // TODO: Clear stored tokens
        // localStorage.removeItem('auth_token');
    }

    /**
     * Clears any existing error state.
     */
    clearError(): void {
        this.errorSignal.set(null);
    }

    /**
     * Checks for existing session on app initialization.
     */
    private checkStoredSession(): void {
        // TODO: Implement session restoration from localStorage/cookies
        // const token = localStorage.getItem('auth_token');
        // if (token) { ... validate and restore session ... }
    }
}
