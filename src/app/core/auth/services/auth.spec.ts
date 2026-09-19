import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

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
  let storageClear: ReturnType<typeof vi.fn>;
  let storageStore: ReturnType<typeof vi.fn>;
  let clearProfile: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    activeToken = 'active-token';
    httpGet = vi.fn();
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
            post: vi.fn(),
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
  });

  it.each([0, 403, 503])(
    'should preserve the local session when verification fails with status %s',
    async (status) => {
      httpGet.mockReturnValue(throwError(() => new HttpErrorResponse({
        status,
        statusText: status === 0 ? 'Unknown Error' : 'Request failed',
      })));

      const result = await service.verifySession();

      expect(result).toBe(true);
      expect(service.isAuthenticated()).toBe(true);
      expect(activeToken).toBe('active-token');
      expect(storageClear).not.toHaveBeenCalled();
      expect(clearProfile).not.toHaveBeenCalled();
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
    expect(httpGet).toHaveBeenCalledWith(API_ENDPOINTS.USERS.ME);
    expect(service.currentUser()).toEqual(refreshedUser);
    expect(storageStore).toHaveBeenCalledWith('active-token', refreshedUser);
  });
});
