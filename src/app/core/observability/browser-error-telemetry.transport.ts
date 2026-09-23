import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, isDevMode } from '@angular/core';

import { environment } from '@environments/environment';
import { ErrorTelemetryEvent, ErrorTelemetryTransport } from './error-telemetry.model';
import { TelemetryDeliveryPolicy } from './telemetry-delivery-policy';

@Injectable({ providedIn: 'root' })
export class BrowserErrorTelemetryTransport implements ErrorTelemetryTransport {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly deliveryPolicy = new TelemetryDeliveryPolicy();

  send(event: ErrorTelemetryEvent): void {
    const telemetryUrl = environment.telemetryUrl;
    if (
      isDevMode() ||
      !environment.production ||
      !telemetryUrl ||
      !isPlatformBrowser(this.platformId)
    ) {
      return;
    }

    if (this.deliveryPolicy.tryAcquire()) {
      void this.deliver(event, telemetryUrl);
    }
  }

  private async deliver(event: ErrorTelemetryEvent, telemetryUrl: string): Promise<void> {
    try {
      const response = await fetch(telemetryUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
        credentials: 'omit',
        keepalive: true,
      });

      if (response.ok) {
        this.deliveryPolicy.recordSuccess();
      } else {
        this.deliveryPolicy.recordFailure();
      }
    } catch {
      this.deliveryPolicy.recordFailure();
    }
  }
}
