import { TestBed } from '@angular/core/testing';
import { MarketService } from '@core/services/market/market';
import { AuthService } from '../services/auth';
import { appInit } from './app-init';

describe('public application bootstrap', () => {
  it('does not return the pending session check to the Angular initializer', () => {
    const verifySession = vi.fn(() => new Promise<boolean>(() => {}));
    const initialize = vi.fn().mockResolvedValue(undefined);
    TestBed.configureTestingModule({ providers: [
      { provide: AuthService, useValue: { verifySession } },
      { provide: MarketService, useValue: { initialize } },
    ] });

    expect(TestBed.runInInjectionContext(appInit)).toBeUndefined();
    expect(verifySession).toHaveBeenCalledOnce();
    expect(initialize).toHaveBeenCalledOnce();
  });
});
