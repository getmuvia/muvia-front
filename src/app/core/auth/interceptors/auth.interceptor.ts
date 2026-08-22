import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject, Injector, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '@environments/environment';
import { AuthService } from '../services/auth';
import { AuthStorageService } from '../services/storage';

/**
 * Interceptor that handles 401 Unauthorized errors and attaches the Bearer token.
 * Logs out the user and redirects to login page on 401.
 * 
 * During SSR, only throws the error without trying to logout/navigate.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const platformId = inject(PLATFORM_ID);
    const router = inject(Router);
    const injector = inject(Injector);
    const storage = inject(AuthStorageService);

    const token = storage.getToken();
    const apiUrl = environment.apiUrl.replace(/\/+$/, '');
    const isApiRequest = req.url === apiUrl || req.url.startsWith(`${apiUrl}/`);
    const isAuthenticationRequest =
        req.url === `${apiUrl}/auth/login` || req.url === `${apiUrl}/auth/register`;

    if (token && isApiRequest && !isAuthenticationRequest) {
        req = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });
    }

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            const shouldInvalidateSession =
                error.status === 401 &&
                !!token &&
                isApiRequest &&
                !isAuthenticationRequest &&
                isPlatformBrowser(platformId);

            if (shouldInvalidateSession) {
                const authService = injector.get(AuthService);
                authService.logout();
                router.navigate(['/auth/login']);
            }
            return throwError(() => error);
        })
    );
};
