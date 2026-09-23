import { TelemetryDeliveryPolicy } from './telemetry-delivery-policy';

describe('TelemetryDeliveryPolicy', () => {
  let currentTime: number;
  let policy: TelemetryDeliveryPolicy;

  beforeEach(() => {
    currentTime = 1_000_000;
    policy = new TelemetryDeliveryPolicy(() => currentTime);
  });

  it('limits delivery to five events per minute', () => {
    expect(Array.from({ length: 5 }, () => policy.tryAcquire())).toEqual([
      true,
      true,
      true,
      true,
      true,
    ]);
    expect(policy.tryAcquire()).toBe(false);

    currentTime += 60_001;
    expect(policy.tryAcquire()).toBe(true);
  });

  it('limits the total events sent during one application session', () => {
    for (let window = 0; window < 4; window += 1) {
      for (let event = 0; event < 5; event += 1) {
        expect(policy.tryAcquire()).toBe(true);
      }
      currentTime += 60_001;
    }

    expect(policy.tryAcquire()).toBe(false);
  });

  it('opens the circuit after three consecutive collector failures', () => {
    policy.recordFailure();
    policy.recordFailure();
    policy.recordFailure();

    expect(policy.tryAcquire()).toBe(false);

    currentTime += 5 * 60_000 + 1;
    expect(policy.tryAcquire()).toBe(true);
  });

  it('resets the failure sequence after a successful delivery', () => {
    policy.recordFailure();
    policy.recordFailure();
    policy.recordSuccess();
    policy.recordFailure();

    expect(policy.tryAcquire()).toBe(true);
  });
});
