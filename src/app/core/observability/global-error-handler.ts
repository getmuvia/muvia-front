import { isPlatformBrowser } from '@angular/common';
import { ErrorHandler, Injectable, PLATFORM_ID, inject, isDevMode } from '@angular/core';

import { ErrorTelemetryService } from './error-telemetry';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly telemetry = inject(ErrorTelemetryService);
  private readonly platformId = inject(PLATFORM_ID);

  handleError(error: unknown): void {
    let incidentId = 'unavailable';
    try {
      incidentId = this.telemetry.captureUnexpectedError(error);
    } catch {
      // The error handler must remain safe even if telemetry initialization fails.
    }

    if (isDevMode() || !isPlatformBrowser(this.platformId)) {
      console.error(`[Muvia incident ${incidentId}]`, error);
    }
  }
}
