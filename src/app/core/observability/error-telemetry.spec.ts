import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';

import { APP_RELEASE } from '@environments/release';
import { ERROR_TELEMETRY_TRANSPORT, ErrorTelemetryService } from './error-telemetry';
import { ErrorTelemetryEvent } from './error-telemetry.model';

describe('ErrorTelemetryService', () => {
  let service: ErrorTelemetryService;
  let send: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    send = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        ErrorTelemetryService,
        { provide: ERROR_TELEMETRY_TRANSPORT, useValue: { send } },
        {
          provide: DOCUMENT,
          useValue: { location: { pathname: '/seller/products/42' } },
        },
      ],
    });
    service = TestBed.inject(ErrorTelemetryService);
  });

  it('sends sanitized technical context without secrets or URL parameters', () => {
    const error = new Error(
      'Request failed for seller@example.com with Bearer secret-token at https://api.example.com/items?token=secret',
    );

    const incidentId = service.captureUnexpectedError(error);

    expect(incidentId).toMatch(/^[0-9a-f-]{36}$/i);
    expect(send).toHaveBeenCalledOnce();
    const event = send.mock.calls[0][0] as ErrorTelemetryEvent;
    expect(event).toMatchObject({
      incidentId,
      correlationId: incidentId,
      source: 'global',
      severity: 'fatal',
      route: '/seller/products/:id',
      release: APP_RELEASE,
    });
    expect(event.message).toContain('[redacted-email]');
    expect(event.message).toContain('Bearer [redacted]');
    expect(event.message).toContain('https://api.example.com/items');
    expect(event.message).not.toContain('seller@example.com');
    expect(event.message).not.toContain('?token=secret');
  });

  it('deduplicates repeated reporting of the same error object', () => {
    const error = new Error('render failed');

    const firstIncident = service.captureUnexpectedError(error);
    const secondIncident = service.captureApplicationError('render failed', error, 'ProductCard');

    expect(secondIncident).toBe(firstIncident);
    expect(send).toHaveBeenCalledOnce();
  });

  it('does not propagate transport failures into the application', () => {
    send.mockImplementation(() => {
      throw new Error('collector unavailable');
    });

    expect(() => service.captureUnexpectedError(new Error('UI failure'))).not.toThrow();
  });
});
