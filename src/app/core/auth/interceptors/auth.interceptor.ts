import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject, Injector, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { Auth } from '../services/auth';

/**
 * Interceptor that handles 401 Unauthorized errors.
 * Logs out the user and redirects to login page.
 * 
 * During SSR, only throws the error without trying to logout/navigate.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const platformId = inject(PLATFORM_ID);
    const router = inject(Router);
    const injector = inject(Injector);

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            // Only handle 401 errors in the browser
            if (error.status === 401 && isPlatformBrowser(platformId)) {
                const authService = injector.get(Auth);
                authService.logout();
                router.navigate(['/auth/login']);
            }
            return throwError(() => error);
        })
    );
};
