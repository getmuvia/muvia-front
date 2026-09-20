import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';

import { ErrorTelemetryService } from '@core/observability/error-telemetry';
import { LoggerService } from './logger';

describe('LoggerService', () => {
  let captureApplicationError: ReturnType<typeof vi.fn>;
  let service: LoggerService;

  beforeEach(() => {
    captureApplicationError = vi.fn();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    TestBed.configureTestingModule({
      providers: [
        LoggerService,
        { provide: ErrorTelemetryService, useValue: { captureApplicationError } },
      ],
    });
    service = TestBed.inject(LoggerService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('delegates non-HTTP application failures to telemetry', () => {
    const error = new Error('Render failed');

    service.error('Could not render product', error, 'ProductCard');

    expect(captureApplicationError).toHaveBeenCalledWith(
      'Could not render product',
      error,
      'ProductCard',
    );
  });

  it('leaves HTTP telemetry to the interceptor policy', () => {
    service.error('Request failed', new HttpErrorResponse({ status: 422 }), 'ProductForm');

    expect(captureApplicationError).not.toHaveBeenCalled();
  });
});
