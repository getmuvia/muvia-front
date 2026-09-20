import { HttpErrorResponse, HttpRequest } from '@angular/common/http';

import { API_ENDPOINTS } from '@core/constants/api-endpoints';
import {
  createHttpErrorFeedbackContext,
  HttpErrorTelemetryPolicy,
} from '@core/models/errors/http-error-feedback';
import { shouldCaptureHttpError } from './http-error-telemetry-policy';

const INCLUDED_SAMPLE_ID = '00000000-0000-4000-8000-000000000000';
const EXCLUDED_SAMPLE_ID = 'ffffffff-ffff-4fff-bfff-ffffffffffff';

describe('shouldCaptureHttpError', () => {
  it('always captures server failures, including locally expected workflows', () => {
    const request = createRequest('/products', { expectedStatuses: [503] });

    expect(shouldCaptureHttpError(createError(503), request, EXCLUDED_SAMPLE_ID)).toBe(true);
  });

  it('filters known business outcomes', () => {
    const error = createError(409, { code: 'PRODUCT_LIMIT_REACHED' });

    expect(shouldCaptureHttpError(error, createRequest('/products'), INCLUDED_SAMPLE_ID)).toBe(false);
  });

  it.each([
    [API_ENDPOINTS.AUTH.LOGIN, 401],
    [API_ENDPOINTS.AUTH.REGISTER, 409],
  ])('filters routine authentication outcome %s %i', (url, status) => {
    const request = new HttpRequest('POST', url, {});

    expect(shouldCaptureHttpError(createError(status), request, INCLUDED_SAMPLE_ID)).toBe(false);
  });

  it('filters handled client errors from an explicitly expected workflow', () => {
    const request = createRequest('/products', { expectedStatuses: [422] });

    expect(shouldCaptureHttpError(createError(422), request, INCLUDED_SAMPLE_ID)).toBe(false);
  });

  it('captures an unknown validation failure unless its workflow marks it as expected', () => {
    expect(shouldCaptureHttpError(
      createError(400),
      createRequest('/products'),
      EXCLUDED_SAMPLE_ID,
    )).toBe(true);
  });

  it.each([0, 408, 401, 403, 404, 429])(
    'samples HTTP %i instead of reporting every occurrence',
    (status) => {
      const request = createRequest('/products');

      expect(shouldCaptureHttpError(createError(status), request, INCLUDED_SAMPLE_ID)).toBe(true);
      expect(shouldCaptureHttpError(createError(status), request, EXCLUDED_SAMPLE_ID)).toBe(false);
    },
  );

  it('filters requests cancelled by the client', () => {
    const error = createError(0, { name: 'AbortError' });

    expect(shouldCaptureHttpError(error, createRequest('/products'), INCLUDED_SAMPLE_ID)).toBe(false);
  });

  it('allows critical workflows to override filtering and sampling', () => {
    const request = createRequest('/products', { mode: 'always' });

    expect(shouldCaptureHttpError(createError(401), request, EXCLUDED_SAMPLE_ID)).toBe(true);
  });
});

function createRequest(
  path: string,
  telemetry: HttpErrorTelemetryPolicy = {},
): HttpRequest<unknown> {
  return new HttpRequest('GET', `https://api.example.com${path}`, {
    context: createHttpErrorFeedbackContext('local', telemetry),
  });
}

function createError(status: number, error?: unknown): HttpErrorResponse {
  return new HttpErrorResponse({ status, error });
}
