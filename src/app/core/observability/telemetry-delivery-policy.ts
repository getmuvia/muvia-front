const WINDOW_MS = 60_000;
const MAX_EVENTS_PER_WINDOW = 5;
const MAX_EVENTS_PER_SESSION = 20;
const FAILURE_THRESHOLD = 3;
const CIRCUIT_OPEN_MS = 5 * 60_000;

/**
 * Bounds telemetry traffic in one browser session and temporarily stops
 * delivery when the collector repeatedly fails.
 */
export class TelemetryDeliveryPolicy {
  private readonly eventTimestamps: number[] = [];
  private sessionEventCount = 0;
  private consecutiveFailures = 0;
  private circuitOpenUntil = 0;

  constructor(private readonly now: () => number = () => Date.now()) {}

  tryAcquire(): boolean {
    const currentTime = this.now();
    if (currentTime < this.circuitOpenUntil || this.sessionEventCount >= MAX_EVENTS_PER_SESSION) {
      return false;
    }

    while (
      this.eventTimestamps.length > 0 &&
      this.eventTimestamps[0] <= currentTime - WINDOW_MS
    ) {
      this.eventTimestamps.shift();
    }

    if (this.eventTimestamps.length >= MAX_EVENTS_PER_WINDOW) return false;

    this.eventTimestamps.push(currentTime);
    this.sessionEventCount += 1;
    return true;
  }

  recordSuccess(): void {
    this.consecutiveFailures = 0;
  }

  recordFailure(): void {
    this.consecutiveFailures += 1;
    if (this.consecutiveFailures < FAILURE_THRESHOLD) return;

    this.circuitOpenUntil = this.now() + CIRCUIT_OPEN_MS;
    this.consecutiveFailures = 0;
  }
}
