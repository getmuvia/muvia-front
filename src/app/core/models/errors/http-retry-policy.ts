import { HttpErrorResponse } from '@angular/common/http';

const AUTOMATIC_RETRY_STATUSES = new Set([0, 408, 429, 502, 503, 504]);
const DEFAULT_RETRY_DELAY_MS = 750;
const MAX_RETRY_AFTER_MS = 30_000;

/**
 * Returns the delay for a safe automatic retry, or null when the response is
 * permanent and must be handled by the owning screen.
 */
export function getAutomaticRetryDelay(
  error: unknown,
  retryCount: number,
): number | null {
  if (!(error instanceof HttpErrorResponse)
    || !AUTOMATIC_RETRY_STATUSES.has(error.status)) {
    return null;
  }

  if (error.status === 429) {
    const retryAfter = parseRetryAfter(error.headers.get('Retry-After'));
    if (retryAfter !== null) return Math.min(retryAfter, MAX_RETRY_AFTER_MS);
  }

  return Math.min(Math.max(retryCount, 1) * DEFAULT_RETRY_DELAY_MS, MAX_RETRY_AFTER_MS);
}

function parseRetryAfter(value: string | null): number | null {
  if (!value) return null;

  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return seconds * 1000;
  }

  const date = Date.parse(value);
  if (Number.isNaN(date)) return null;
  return Math.max(0, date - Date.now());
}
