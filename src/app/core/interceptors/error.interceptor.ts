import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { tap } from 'rxjs';
import { ToastService } from '@core/services/toast/toast';
import { API_ENDPOINTS } from '@core/constants/api-endpoints';
import { toAppError } from '@core/models/errors/api-error.model';
import { HTTP_ERROR_FEEDBACK } from '@core/models/errors/http-error-feedback';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
    const toastService = inject(ToastService);
    const isAuthenticationRequest =
        req.url === API_ENDPOINTS.AUTH.LOGIN || req.url === API_ENDPOINTS.AUTH.REGISTER;
    const errorFeedback = req.context.get(HTTP_ERROR_FEEDBACK);

    return next(req).pipe(
        tap({
            error: (error: HttpErrorResponse) => {
                // Authentication owns 401 presentation so concurrent failures
                // produce a single logout, redirect and notification.
                const isSessionUnauthorized =
                    error.status === 401 && req.headers.has('Authorization');
                if (isAuthenticationRequest || errorFeedback !== 'global' || isSessionUnauthorized) return;

                toastService.error(toAppError(error).message);
            }
        })
    );
};
