import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../services/auth';

/**
 * Guard that protects routes requiring authentication.
 * Redirects to login if user is not authenticated.
 * 
 * During SSR, allows navigation since localStorage is not available.
 * The actual validation happens after hydration on the client.
 */
export const authGuard: CanActivateFn = () => {
    const platformId = inject(PLATFORM_ID);
    const authService = inject(Auth);
    const router = inject(Router);

    // During SSR, allow navigation - validation happens on the client
    if (!isPlatformBrowser(platformId)) {
        return true;
    }

    if (authService.isAuthenticated()) {
        return true;
    }

    // Redirect to login page
    return router.createUrlTree(['/auth/login']);
};

/**
 * Guard that prevents authenticated users from accessing guest-only pages.
 * Redirects to home if user is already authenticated.
 * 
 * During SSR, allows navigation since localStorage is not available.
 * The actual validation happens after hydration on the client.
 */
export const guestGuard: CanActivateFn = () => {
    const platformId = inject(PLATFORM_ID);
    const authService = inject(Auth);
    const router = inject(Router);

    // During SSR, allow navigation - validation happens on the client
    if (!isPlatformBrowser(platformId)) {
        return true;
    }

    if (!authService.isAuthenticated()) {
        return true;
    }

    // Redirect to home page
    return router.createUrlTree(['/home']);
};
