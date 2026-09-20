import { HttpErrorResponse, HttpRequest } from '@angular/common/http';

import { API_ENDPOINTS } from '@core/constants/api-endpoints';
import { AppErrorKind, toAppError } from '@core/models/errors/api-error.model';
import { HTTP_ERROR_TELEMETRY } from '@core/models/errors/http-error-feedback';

const EXPECTED_BUSINESS_CODES = new Set([
  'EMAIL_ALREADY_REGISTERED',
  'INVALID_CREDENTIALS',
  'INVALID_CURRENT_PASSWORD',
  'PRODUCT_LIMIT_REACHED',
]);

export const DEFAULT_HTTP_ERROR_SAMPLE_RATES: Readonly<Partial<Record<AppErrorKind, number>>> = {
  network: 0.25,
  authentication: 0.1,
  authorization: 0.1,
  'not-found': 0.1,
  'rate-limit': 0.25,
};

/**
 * Decides whether an HTTP failure is actionable telemetry. UI feedback and
 * application error handling continue independently of this decision.
 */
export function shouldCaptureHttpError(
  error: HttpErrorResponse,
  request: HttpRequest<unknown>,
  correlationId: string,
  sampleRates = DEFAULT_HTTP_ERROR_SAMPLE_RATES,
): boolean {
  const policy = request.context.get(HTTP_ERROR_TELEMETRY);
  if (policy.mode === 'always') return true;
  if (isClientCancellation(error)) return false;
  if (error.status >= 500) return true;

  const appError = toAppError(error);
  if (appError.code && (
    EXPECTED_BUSINESS_CODES.has(appError.code)
    || policy.expectedCodes?.includes(appError.code)
  )) return false;
  if (isExpectedAuthenticationOutcome(request, error.status)) return false;
  if (policy.expectedStatuses?.includes(error.status)) return false;

  const sampleRate = sampleRates[appError.kind];
  return sampleRate === undefined || isInSample(correlationId, sampleRate);
}

function isExpectedAuthenticationOutcome(
  request: HttpRequest<unknown>,
  status: number,
): boolean {
  if (request.method !== 'POST') return false;
  if (request.url === API_ENDPOINTS.AUTH.LOGIN) {
    return status === 400 || status === 401 || status === 422;
  }
  if (request.url === API_ENDPOINTS.AUTH.REGISTER) {
    return status === 400 || status === 409 || status === 422;
  }
  return false;
}

function isClientCancellation(error: HttpErrorResponse): boolean {
  if (error.status !== 0 || typeof error.error !== 'object' || error.error === null) return false;
  const cause = error.error as { name?: unknown; type?: unknown };
  return cause.name === 'AbortError' || cause.type === 'abort';
}

function isInSample(correlationId: string, rate: number): boolean {
  if (rate <= 0) return false;
  if (rate >= 1) return true;
  const bucket = Number.parseInt(correlationId.replace(/-/g, '').slice(0, 8), 16);
  return Number.isFinite(bucket) && bucket / 0x1_0000_0000 < rate;
}
