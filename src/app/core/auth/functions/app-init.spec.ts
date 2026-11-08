import { Location } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { MarketService } from '@core/services/market/market';
import { NewArrivalsStore } from '@core/services/product/new-arrivals.store';
import { AuthService } from '../services/auth';
import { appInit } from './app-init';

describe('public application bootstrap', () => {
  let entryPath: string;
  let verifySession: ReturnType<typeof vi.fn>;
  let initialize: ReturnType<typeof vi.fn>;
  let prefetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    entryPath = '/home';
    verifySession = vi.fn(() => new Promise<boolean>(() => {}));
    initialize = vi.fn(() => new Promise<void>(() => {}));
    prefetch = vi.fn();
    TestBed.configureTestingModule({ providers: [
      { provide: AuthService, useValue: { verifySession } },
      { provide: MarketService, useValue: { initialize } },
      { provide: Location, useValue: { path: () => entryPath } },
      { provide: NewArrivalsStore, useValue: { prefetch } },
    ] });
  });

  it('starts home prefetch without waiting for market or session verification', () => {
    expect(TestBed.runInInjectionContext(appInit)).toBeUndefined();
    expect(prefetch).toHaveBeenCalledOnce();
    expect(verifySession).toHaveBeenCalledOnce();
    expect(initialize).toHaveBeenCalledOnce();
    expect(prefetch.mock.invocationCallOrder[0]).toBeLessThan(initialize.mock.invocationCallOrder[0]);
    expect(prefetch.mock.invocationCallOrder[0]).toBeLessThan(verifySession.mock.invocationCallOrder[0]);
  });

  it.each(['', '/home', '/home?campaign=launch'])('prefetches a home entry at "%s"', path => {
    entryPath = path;
    TestBed.runInInjectionContext(appInit);
    expect(prefetch).toHaveBeenCalledOnce();
  });

  it.each(['/products', '/products/example', '/seller/profile', '/auth/login'])(
    'does not request home products when entering "%s"', path => {
      entryPath = path;
      TestBed.runInInjectionContext(appInit);
      expect(prefetch).not.toHaveBeenCalled();
    },
  );
});
