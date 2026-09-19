import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse, HttpRequest } from '@angular/common/http';
import { Injectable, InjectionToken, PLATFORM_ID, inject } from '@angular/core';

import { toAppError } from '@core/models/errors/api-error.model';
import { environment } from '@environments/environment';
import { APP_RELEASE } from '@environments/release';
import { BrowserErrorTelemetryTransport } from './browser-error-telemetry.transport';
import {
  CORRELATION_ID_HEADER,
  ErrorTelemetryEvent,
  ErrorTelemetryTransport,
} from './error-telemetry.model';

export const ERROR_TELEMETRY_TRANSPORT = new InjectionToken<ErrorTelemetryTransport>(
  'ERROR_TELEMETRY_TRANSPORT',
  {
    providedIn: 'root',
    factory: () => inject(BrowserErrorTelemetryTransport),
  },
);

interface ErrorDetails {
  name: string | null;
  message: string;
  stack: string | null;
}

@Injectable({ providedIn: 'root' })
export class ErrorTelemetryService {
  private readonly transport = inject(ERROR_TELEMETRY_TRANSPORT);
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly reportedObjects = new WeakMap<object, string>();
  private readonly recentFingerprints = new Map<string, { incidentId: string; timestamp: number }>();
  private readonly duplicateWindowMs = 5000;

  captureUnexpectedError(error: unknown): string {
    const details = this.getErrorDetails(error);
    return this.capture({
      source: 'global',
      severity: 'fatal',
      message: details.message,
      errorName: details.name,
      stack: details.stack,
      context: 'Angular ErrorHandler',
    }, error);
  }

  captureApplicationError(message: string, error?: unknown, context?: string): string {
    const details = this.getErrorDetails(error);
    return this.capture({
      source: 'application',
      severity: 'error',
      message: message || details.message,
      errorName: details.name,
      stack: details.stack,
      context: context ?? null,
    }, error);
  }

  captureHttpFailure(
    error: HttpErrorResponse,
    request: HttpRequest<unknown>,
    requestCorrelationId: string,
  ): string {
    const appError = toAppError(error);
    const correlationId = appError.correlationId ?? requestCorrelationId;
    return this.capture({
      source: 'http',
      severity: error.status === 0 || error.status >= 500 ? 'error' : 'warning',
      message: appError.message,
      errorName: 'HttpErrorResponse',
      stack: null,
      context: null,
      correlationId,
      httpMethod: request.method,
      httpPath: this.sanitizePath(request.urlWithParams),
      httpStatus: error.status,
      errorKind: appError.kind,
      errorCode: appError.code,
    }, error);
  }

  private capture(
    partial: Partial<ErrorTelemetryEvent> & Pick<ErrorTelemetryEvent, 'source' | 'severity' | 'message'>,
    originalError?: unknown,
  ): string {
    if (typeof originalError === 'object' && originalError !== null) {
      const existingIncident = this.reportedObjects.get(originalError);
      if (existingIncident) return existingIncident;
    }

    const sanitizedMessage = this.sanitizeText(partial.message, 500, false);
    const sanitizedStack = partial.stack
      ? this.sanitizeText(partial.stack, 8000, true)
      : null;
    const fingerprint = [partial.source, sanitizedMessage, sanitizedStack?.split('\n')[0] ?? ''].join('|');
    const recent = this.recentFingerprints.get(fingerprint);
    if (recent && Date.now() - recent.timestamp < this.duplicateWindowMs) {
      if (typeof originalError === 'object' && originalError !== null) {
        this.reportedObjects.set(originalError, recent.incidentId);
      }
      return recent.incidentId;
    }

    const incidentId = createCorrelationId();
    const correlationId = isCorrelationId(partial.correlationId)
      ? partial.correlationId
      : incidentId;
    const event: ErrorTelemetryEvent = {
      schemaVersion: 1,
      incidentId,
      correlationId,
      occurredAt: new Date().toISOString(),
      source: partial.source,
      severity: partial.severity,
      message: sanitizedMessage || 'Unexpected application error',
      errorName: partial.errorName ? this.sanitizeText(partial.errorName, 100, false) : null,
      stack: sanitizedStack,
      route: this.currentRoute(),
      environment: environment.name,
      release: APP_RELEASE,
      runtime: isPlatformBrowser(this.platformId) ? 'browser' : 'server',
      context: partial.context ? this.sanitizeText(partial.context, 100, false) : null,
      httpMethod: partial.httpMethod ? this.sanitizeText(partial.httpMethod, 10, false) : null,
      httpPath: partial.httpPath ? this.sanitizePath(partial.httpPath) : null,
      httpStatus: partial.httpStatus ?? null,
      errorKind: partial.errorKind ? this.sanitizeText(partial.errorKind, 40, false) : null,
      errorCode: partial.errorCode ? this.sanitizeText(partial.errorCode, 80, false) : null,
    };

    this.recentFingerprints.set(fingerprint, { incidentId, timestamp: Date.now() });
    if (typeof originalError === 'object' && originalError !== null) {
      this.reportedObjects.set(originalError, incidentId);
    }
    this.pruneFingerprints();

    try {
      this.transport.send(event);
    } catch {
      // Observability must never break the user flow it is monitoring.
    }

    return incidentId;
  }

  private getErrorDetails(value: unknown): ErrorDetails {
    const error = unwrapError(value);
    if (error instanceof Error) {
      return {
        name: error.name || 'Error',
        message: this.sanitizeText(error.message || 'Unexpected application error', 500, false),
        stack: error.stack ? this.sanitizeText(error.stack, 8000, true) : null,
      };
    }

    return {
      name: null,
      message: this.sanitizeText(String(error ?? 'Unexpected application error'), 500, false),
      stack: null,
    };
  }

  private currentRoute(): string {
    const pathname = this.document.location?.pathname ?? '/';
    return this.sanitizePath(pathname);
  }

  private sanitizePath(value: string): string {
    try {
      const url = new URL(value, 'https://muvia.local');
      return sanitizeIdentifiers(url.pathname).slice(0, 500) || '/';
    } catch {
      return sanitizeIdentifiers(value.split(/[?#]/, 1)[0]).slice(0, 500) || '/';
    }
  }

  private sanitizeText(value: string, maxLength: number, preserveNewlines: boolean): string {
    const withoutSecrets = value
      .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, 'Bearer [redacted]')
      .replace(/\beyJ[A-Za-z0-9_-]{20,}(?:\.[A-Za-z0-9_-]{10,}){1,2}\b/g, '[redacted-token]')
      .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[redacted-email]')
      .replace(/https?:\/\/[^\s)\]}]+/gi, match => stripUrlDetails(match));
    const controlPattern = preserveNewlines
      ? /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g
      : /[\u0000-\u001F\u007F]/g;
    return withoutSecrets.replace(controlPattern, ' ').trim().slice(0, maxLength);
  }

  private pruneFingerprints(): void {
    const expiry = Date.now() - this.duplicateWindowMs;
    for (const [fingerprint, record] of this.recentFingerprints) {
      if (record.timestamp < expiry) this.recentFingerprints.delete(fingerprint);
    }
  }
}

export function createCorrelationId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, character => {
    const random = Math.floor(Math.random() * 16);
    const value = character === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

export function isCorrelationId(value: unknown): value is string {
  return typeof value === 'string'
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function unwrapError(value: unknown): unknown {
  if (typeof value !== 'object' || value === null) return value;
  const candidate = value as { error?: unknown; rejection?: unknown };
  return candidate.error ?? candidate.rejection ?? value;
}

function stripUrlDetails(value: string): string {
  try {
    const url = new URL(value);
    return `${url.origin}${sanitizeIdentifiers(url.pathname)}`;
  } catch {
    return '[redacted-url]';
  }
}

function sanitizeIdentifiers(value: string): string {
  return value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[redacted-email]')
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi, ':id')
    .replace(/\/\d+(?=\/|$)/g, '/:id');
}
