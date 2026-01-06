import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { Auth } from '../services/auth';

/**
 * Interceptor that handles 401 Unauthorized errors.
 * Logs out the user and redirects to login page.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const router = inject(Router);
    const injector = inject(Injector);

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            if (error.status === 401) {
                const authService = injector.get(Auth);
                authService.logout();
                router.createUrlTree(['/auth/login']);
                router.navigate(['/auth/login']);
            }
            return throwError(() => error);
        })
    );
};
