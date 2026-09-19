import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';

import { getAutomaticRetryDelay } from './http-retry-policy';

describe('getAutomaticRetryDelay', () => {
  it.each([0, 408, 502, 503, 504])('retries transient HTTP %i responses', status => {
    const error = new HttpErrorResponse({ status });

    expect(getAutomaticRetryDelay(error, 2)).toBe(1500);
  });

  it.each([400, 401, 403, 404, 409, 422, 500])(
    'does not retry permanent HTTP %i responses',
    status => {
      const error = new HttpErrorResponse({ status });

      expect(getAutomaticRetryDelay(error, 1)).toBeNull();
    },
  );

  it('respects a bounded Retry-After value for rate limits', () => {
    const error = new HttpErrorResponse({
      status: 429,
      headers: new HttpHeaders({ 'Retry-After': '4' }),
    });

    expect(getAutomaticRetryDelay(error, 1)).toBe(4000);
  });
});
