import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { ErrorTelemetryService } from './error-telemetry';
import { GlobalErrorHandler } from './global-error-handler';

describe('GlobalErrorHandler', () => {
  it('delegates unexpected failures to sanitized telemetry', () => {
    const captureUnexpectedError = vi.fn().mockReturnValue('incident-id');
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    TestBed.configureTestingModule({
      providers: [
        GlobalErrorHandler,
        { provide: ErrorTelemetryService, useValue: { captureUnexpectedError } },
      ],
    });
    const handler = TestBed.inject(GlobalErrorHandler);
    const error = new Error('Unexpected template failure');

    handler.handleError(error);

    expect(captureUnexpectedError).toHaveBeenCalledWith(error);
    consoleError.mockRestore();
  });

  it('keeps server-side failures visible in server logs', () => {
    const captureUnexpectedError = vi.fn().mockReturnValue('server-incident');
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    TestBed.configureTestingModule({
      providers: [
        GlobalErrorHandler,
        { provide: PLATFORM_ID, useValue: 'server' },
        { provide: ErrorTelemetryService, useValue: { captureUnexpectedError } },
      ],
    });
    const error = new Error('SSR failure');

    TestBed.inject(GlobalErrorHandler).handleError(error);

    expect(consoleError).toHaveBeenCalledWith('[Muvia incident server-incident]', error);
    consoleError.mockRestore();
  });
});
