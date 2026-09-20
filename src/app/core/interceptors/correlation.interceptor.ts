import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { ErrorTelemetryService, createCorrelationId, isCorrelationId } from '@core/observability/error-telemetry';
import { CORRELATION_ID_HEADER } from '@core/observability/error-telemetry.model';
import { shouldCaptureHttpError } from '@core/observability/http-error-telemetry-policy';
import { environment } from '@environments/environment';

export const correlationInterceptor: HttpInterceptorFn = (request, next) => {
  const telemetry = inject(ErrorTelemetryService);
  const requestedCorrelationId = request.headers.get(CORRELATION_ID_HEADER);
  const correlationId = isCorrelationId(requestedCorrelationId)
    ? requestedCorrelationId
    : createCorrelationId();
  const apiUrl = environment.apiUrl.replace(/\/+$/, '');
  const isApiRequest = request.url === apiUrl || request.url.startsWith(`${apiUrl}/`);
  const alreadyTriggersPreflight = request.headers.has('Authorization')
    || !['GET', 'HEAD'].includes(request.method);
  const correlatedRequest = isApiRequest && alreadyTriggersPreflight
    ? request.clone({ setHeaders: { [CORRELATION_ID_HEADER]: correlationId } })
    : request;

  return next(correlatedRequest).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse
        && shouldCaptureHttpError(error, correlatedRequest, correlationId)) {
        telemetry.captureHttpFailure(error, correlatedRequest, correlationId);
      }
      return throwError(() => error);
    }),
  );
};
