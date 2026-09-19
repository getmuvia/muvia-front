export const CORRELATION_ID_HEADER = 'X-Correlation-ID';

export type ErrorTelemetrySource = 'global' | 'http' | 'application';
export type ErrorTelemetrySeverity = 'warning' | 'error' | 'fatal';

export interface ErrorTelemetryEvent {
  schemaVersion: 1;
  incidentId: string;
  correlationId: string;
  occurredAt: string;
  source: ErrorTelemetrySource;
  severity: ErrorTelemetrySeverity;
  message: string;
  errorName: string | null;
  stack: string | null;
  route: string;
  environment: string;
  release: string;
  runtime: 'browser' | 'server';
  context: string | null;
  httpMethod: string | null;
  httpPath: string | null;
  httpStatus: number | null;
  errorKind: string | null;
  errorCode: string | null;
}

export interface ErrorTelemetryTransport {
  send(event: ErrorTelemetryEvent): void;
}
