import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { NEVER, Subject, of, throwError } from 'rxjs';

import { API_ENDPOINTS } from '@core/constants/api-endpoints';
import { UserService } from '@core/services/user/user';
import { USER_ROLES, User } from '../models/auth.models';
import { AuthStateService } from './auth-state';
import { AuthStorageService } from './storage';
import { AuthService } from './auth';

describe('AuthService', () => {
  const storedUser: User = {
    id: 'seller-id',
    email: 'seller@getmuvia.com',
    role: USER_ROLES.VENDOR,
  };

  let service: AuthService;
  let activeToken: string | null;
  let httpGet: ReturnType<typeof vi.fn>;
  let httpPost: ReturnType<typeof vi.fn>;
  let storageClear: ReturnType<typeof vi.fn>;
  let storageStore: ReturnType<typeof vi.fn>;
  let clearProfile: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    activeToken = 'active-token';
    httpGet = vi.fn();
    httpPost = vi.fn();
    storageClear = vi.fn(() => {
      activeToken = null;
    });
    storageStore = vi.fn((token: string) => {
      activeToken = token;
    });
    clearProfile = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        AuthStateService,
        {
          provide: HttpClient,
          useValue: {
            get: httpGet,
            post: httpPost,
          },
        },
        {
          provide: AuthStorageService,
          useValue: {
            getToken: vi.fn(() => activeToken),
            getUser: vi.fn(() => storedUser),
            hasSession: vi.fn(() => activeToken !== null),
            store: storageStore,
            clear: storageClear,
          },
        },
        {
          provide: UserService,
          useValue: { clearProfile },
        },
      ],
    });

    service = TestBed.inject(AuthService);
  });

  it('should restore the locally stored session', () => {
    expect(service.isAuthenticated()).toBe(true);
    expect(service.currentUser()).toEqual(storedUser);
    expect(service.isSessionVerified()).toBe(false);
    expect(service.sessionStatus()).toBe('unverified');
  });

  it.each([0, 403, 503])(
    'should preserve the local session when verification fails with status %s',
    async (status) => {
      httpGet.mockReturnValue(throwError(() => new HttpErrorResponse({
        status,
        statusText: status === 0 ? 'Unknown Error' : 'Request failed',
      })));

      const result = await service.verifySession();

      expect(result).toBe(false);
      expect(service.isAuthenticated()).toBe(true);
      expect(activeToken).toBe('active-token');
      expect(storageClear).not.toHaveBeenCalled();
      expect(clearProfile).not.toHaveBeenCalled();
      expect(service.sessionStatus()).toBe('unavailable');
    },
  );

  it('should invalidate the session when verification confirms a 401', async () => {
    httpGet.mockReturnValue(throwError(() => new HttpErrorResponse({
      status: 401,
      statusText: 'Unauthorized',
    })));

    const result = await service.verifySession();

    expect(result).toBe(false);
    expect(service.isAuthenticated()).toBe(false);
    expect(activeToken).toBeNull();
    expect(storageClear).toHaveBeenCalledOnce();
    expect(clearProfile).toHaveBeenCalledOnce();
  });

  it('should invalidate the same active token only once', () => {
    expect(service.invalidateSession('active-token')).toBe(true);
    expect(service.invalidateSession('active-token')).toBe(false);
    expect(storageClear).toHaveBeenCalledOnce();
    expect(clearProfile).toHaveBeenCalledOnce();
  });

  it('should ignore a late 401 from an older token', () => {
    activeToken = 'new-token';

    expect(service.invalidateSession('old-token')).toBe(false);
    expect(activeToken).toBe('new-token');
    expect(storageClear).not.toHaveBeenCalled();
    expect(clearProfile).not.toHaveBeenCalled();
  });

  it('should refresh the stored user after successful verification', async () => {
    const refreshedUser: User = { ...storedUser, email: 'updated@getmuvia.com' };
    httpGet.mockReturnValue(of(refreshedUser));

    const result = await service.verifySession();

    expect(result).toBe(true);
    expect(httpGet).toHaveBeenCalledWith(API_ENDPOINTS.USERS.ME, expect.any(Object));
    expect(service.currentUser()).toEqual(refreshedUser);
    expect(storageStore).toHaveBeenCalledWith('active-token', refreshedUser);
    expect(service.isSessionVerified()).toBe(true);
  });

  it('shares pending verification and reuses a verified session', async () => {
    const response = new Subject<User>();
    httpGet.mockReturnValue(response);

    const first = service.verifySession();
    const second = service.verifySession();
    expect(first).toBe(second);
    expect(httpGet).toHaveBeenCalledOnce();
    expect(service.sessionStatus()).toBe('verifying');

    response.next(storedUser);
    await expect(first).resolves.toBe(true);
    await expect(service.verifySession()).resolves.toBe(true);
    expect(httpGet).toHaveBeenCalledOnce();
  });

  it('does not restore a session when verification completes after logout', async () => {
    const response = new Subject<User>();
    httpGet.mockReturnValue(response);
    const pending = service.verifySession();

    service.logout();
    response.next(storedUser);

    await expect(pending).resolves.toBe(false);
    expect(service.currentUser()).toBeNull();
    expect(activeToken).toBeNull();
    expect(storageStore).not.toHaveBeenCalled();
  });

  it('checks a replacement token instead of reusing another token verification', async () => {
    httpGet.mockReturnValue(of(storedUser));
    await service.verifySession();
    activeToken = 'replacement-token';
    const replacementUser = { ...storedUser, id: 'replacement-user' };
    httpGet.mockReturnValue(of(replacementUser));

    await expect(service.verifySession()).resolves.toBe(true);

    expect(httpGet).toHaveBeenCalledTimes(2);
    expect(service.currentUser()).toEqual(replacementUser);
    expect(storageStore).toHaveBeenLastCalledWith('replacement-token', replacementUser);
  });

  it.each(['success', 'unauthorized'])(
    'ignores an old verification %s after another account signs in',
    async (outcome) => {
      const response = new Subject<User>();
      httpGet.mockReturnValue(response);
      const pending = service.verifySession();
      const newUser = { ...storedUser, id: 'new-user' };
      httpPost.mockReturnValue(of({ accessToken: 'new-token', user: newUser }));
      await service.login({ email: 'new@getmuvia.com', password: 'password' });

      if (outcome === 'success') response.next(storedUser);
      else response.error(new HttpErrorResponse({ status: 401 }));

      await expect(pending).resolves.toBe(true);
      expect(service.currentUser()).toEqual(newUser);
      expect(activeToken).toBe('new-token');
      expect(storageStore).toHaveBeenCalledOnce();
      expect(storageClear).not.toHaveBeenCalled();
    },
  );

  it('bounds verification without deleting credentials on timeout', async () => {
    vi.useFakeTimers();
    try {
      httpGet.mockReturnValue(NEVER);
      const pending = service.verifySession();
      await vi.advanceTimersByTimeAsync(5000);

      await expect(pending).resolves.toBe(false);
      expect(service.sessionStatus()).toBe('unavailable');
      expect(activeToken).toBe('active-token');
      expect(storageClear).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it('does not check an anonymous session', async () => {
    service.logout();
    await expect(service.verifySession()).resolves.toBe(false);
    expect(httpGet).not.toHaveBeenCalled();
  });
});
