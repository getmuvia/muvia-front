import { HttpContext, HttpContextToken } from '@angular/common/http';

/**
 * Defines which layer owns user-facing feedback for an HTTP failure.
 *
 * - global: the interceptor displays a toast.
 * - local: the requesting screen renders a contextual error.
 * - none: the failure is intentionally non-disruptive, such as fallback data.
 */
export type HttpErrorFeedback = 'global' | 'local' | 'none';

export interface HttpErrorTelemetryPolicy {
    mode?: 'auto' | 'always';
    expectedStatuses?: readonly number[];
    expectedCodes?: readonly string[];
}

export interface HttpErrorFeedbackOptions {
    errorFeedback?: HttpErrorFeedback;
    errorTelemetry?: HttpErrorTelemetryPolicy;
}

export const HTTP_ERROR_FEEDBACK = new HttpContextToken<HttpErrorFeedback>(() => 'global');
export const HTTP_ERROR_TELEMETRY = new HttpContextToken<HttpErrorTelemetryPolicy>(() => ({}));

export function createHttpErrorFeedbackContext(
    feedback: HttpErrorFeedback,
    telemetry: HttpErrorTelemetryPolicy = {},
): HttpContext {
    return new HttpContext()
        .set(HTTP_ERROR_FEEDBACK, feedback)
        .set(HTTP_ERROR_TELEMETRY, telemetry);
}
