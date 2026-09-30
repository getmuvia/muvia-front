import { PLATFORM_ID, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth';
import { USER_ROLES } from '../models/auth.models';
import { authGuard, guestGuard, vendorGuard } from './auth.guard';

describe('session-aware route guards', () => {
  let verifySession: ReturnType<typeof vi.fn>;
  let router: { createUrlTree: ReturnType<typeof vi.fn>; parseUrl: ReturnType<typeof vi.fn> };
  const route = {} as ActivatedRouteSnapshot;
  const state = { url: '/seller/products/create' } as RouterStateSnapshot;

  beforeEach(() => {
    verifySession = vi.fn();
    router = { createUrlTree: vi.fn().mockReturnValue('login'), parseUrl: vi.fn().mockReturnValue('home') };
    TestBed.configureTestingModule({ providers: [
      { provide: PLATFORM_ID, useValue: 'browser' },
      { provide: Router, useValue: router },
      { provide: AuthService, useValue: {
        verifySession,
        currentUser: signal({ role: USER_ROLES.VENDOR }),
        getPostAuthRoute: () => '/seller',
      } },
    ] });
  });

  it('waits for verification before allowing a protected route', async () => {
    let resolve!: (verified: boolean) => void;
    verifySession.mockReturnValue(new Promise<boolean>(done => { resolve = done; }));
    const result = TestBed.runInInjectionContext(() => authGuard(route, state));
    expect(router.createUrlTree).not.toHaveBeenCalled();
    resolve(true);
    await expect(result).resolves.toBe(true);
  });

  it('preserves the return URL when a stored session cannot be verified', async () => {
    verifySession.mockResolvedValue(false);
    const result = TestBed.runInInjectionContext(() => authGuard(route, state));
    await expect(result).resolves.toBe('login');
    expect(router.createUrlTree).toHaveBeenCalledWith(['/auth/login'], {
      queryParams: { returnUrl: state.url },
    });
  });

  it('does not admit a restored vendor before verification succeeds', async () => {
    verifySession.mockResolvedValue(false);
    await expect(TestBed.runInInjectionContext(() => vendorGuard(route, state))).resolves.toBe('login');
  });

  it('allows login when verification rejects the restored session', async () => {
    verifySession.mockResolvedValue(false);
    await expect(TestBed.runInInjectionContext(() => guestGuard(route, state))).resolves.toBe(true);
  });

  it('redirects a verified guest to the correct landing page', async () => {
    verifySession.mockResolvedValue(true);
    await expect(TestBed.runInInjectionContext(() => guestGuard(route, state))).resolves.toBe('home');
    expect(router.parseUrl).toHaveBeenCalledWith('/seller');
  });

  it('does not attempt browser session verification during prerendering', async () => {
    TestBed.overrideProvider(PLATFORM_ID, { useValue: 'server' });
    await expect(TestBed.runInInjectionContext(() => authGuard(route, state))).resolves.toBe(true);
    expect(verifySession).not.toHaveBeenCalled();
  });
});
