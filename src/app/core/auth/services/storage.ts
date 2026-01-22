import { inject, PLATFORM_ID, Injectable } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { User } from '../models/auth.models';

const AUTH_TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

@Injectable({
    providedIn: 'root'
})
export class AuthStorageService {
    private readonly platformId = inject(PLATFORM_ID);

    /**
     * Checks if running in browser environment.
     */
    private isBrowser(): boolean {
        return isPlatformBrowser(this.platformId);
    }

    /**
     * Stores authentication data in localStorage.
     */
    store(token: string, user: User): void {
        if (!this.isBrowser()) return;

        localStorage.setItem(AUTH_TOKEN_KEY, token);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
    }

    /**
     * Clears all authentication data from localStorage.
     */
    clear(): void {
        if (!this.isBrowser()) return;

        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    }

    /**
     * Gets the stored access token.
     */
    getToken(): string | null {
        if (!this.isBrowser()) return null;
        return localStorage.getItem(AUTH_TOKEN_KEY);
    }

    /**
     * Gets the stored user data.
     */
    getUser(): User | null {
        if (!this.isBrowser()) return null;

        const userJson = localStorage.getItem(USER_KEY);
        if (!userJson) return null;

        try {
            return JSON.parse(userJson) as User;
        } catch {
            this.clear();
            return null;
        }
    }

    /**
     * Checks if a valid session exists.
     */
    hasSession(): boolean {
        return this.getToken() !== null && this.getUser() !== null;
    }
}
