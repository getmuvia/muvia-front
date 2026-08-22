import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { tap } from 'rxjs';
import { ToastService } from '@core/services/toast/toast';
import { API_ENDPOINTS } from '@core/constants/api-endpoints';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
    const toastService = inject(ToastService);
    const platformId = inject(PLATFORM_ID);
    const isAuthenticationRequest =
        req.url === API_ENDPOINTS.AUTH.LOGIN || req.url === API_ENDPOINTS.AUTH.REGISTER;

    return next(req).pipe(
        tap({
            error: (error: HttpErrorResponse) => {
                if (isAuthenticationRequest) return;

                let errorMessage = 'An unexpected error occurred';

                if (isPlatformBrowser(platformId) && error.error instanceof ErrorEvent) {

                    errorMessage = error.error.message;
                } else {

                    if (error.status === 0) {
                        errorMessage = 'No connection to server';
                    } else if (error.status === 401) {
                        errorMessage = 'Session expired or unauthorized';
                    } else if (error.status === 403) {
                        errorMessage = 'You do not have permission to perform this action';
                    } else if (error.status === 404) {
                        errorMessage = 'Resource not found';
                    } else if (error.error && error.error.message) {
                        errorMessage = error.error.message;
                    } else {
                        errorMessage = `Server Error (Code: ${error.status})`;
                    }
                }

                toastService.error(errorMessage);
            }
        })
    );
};
