import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard that protects routes requiring authentication.
 * Redirects to login if user is not authenticated.
 */
export const authGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.isAuthenticated()) {
        return true;
    }

    // Redirect to login page
    return router.createUrlTree(['/auth/login']);
};

/**
 * Guard that prevents authenticated users from accessing guest-only pages.
 * Redirects to home if user is already authenticated.
 */
export const guestGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isAuthenticated()) {
        return true;
    }

    // Redirect to home page
    return router.createUrlTree(['/home']);
};
