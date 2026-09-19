import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, isDevMode } from '@angular/core';

import { environment } from '@environments/environment';
import { ErrorTelemetryEvent, ErrorTelemetryTransport } from './error-telemetry.model';

@Injectable({ providedIn: 'root' })
export class BrowserErrorTelemetryTransport implements ErrorTelemetryTransport {
  private readonly platformId = inject(PLATFORM_ID);

  send(event: ErrorTelemetryEvent): void {
    if (isDevMode()
      || !environment.production
      || !environment.telemetryUrl
      || !isPlatformBrowser(this.platformId)) {
      return;
    }

    void fetch(environment.telemetryUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
      credentials: 'omit',
      keepalive: true,
    }).catch(() => undefined);
  }
}
