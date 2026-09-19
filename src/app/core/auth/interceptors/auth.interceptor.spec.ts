import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { errorInterceptor } from '@core/interceptors/error.interceptor';
import { ToastService } from '@core/services/toast/toast';
import { environment } from '@environments/environment';
import { AuthService } from '../services/auth';
import { AuthStorageService } from '../services/storage';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;
  let invalidateSession: ReturnType<typeof vi.fn>;
  let navigate: ReturnType<typeof vi.fn>;
  let toastWarning: ReturnType<typeof vi.fn>;
  let toastError: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    invalidateSession = vi.fn();
    navigate = vi.fn().mockResolvedValue(true);
    toastWarning = vi.fn();
    toastError = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
        provideHttpClientTesting(),
        { provide: PLATFORM_ID, useValue: 'browser' },
        {
          provide: AuthStorageService,
          useValue: { getToken: vi.fn(() => 'active-token') },
        },
        {
          provide: AuthService,
          useValue: { invalidateSession },
        },
        {
          provide: Router,
          useValue: { navigate },
        },
        {
          provide: ToastService,
          useValue: {
            warning: toastWarning,
            error: toastError,
          },
        },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should emit one logout flow for concurrent 401 responses', () => {
    invalidateSession.mockReturnValueOnce(true).mockReturnValue(false);
    const requestUrl = `${environment.apiUrl}/products`;

    http.get(requestUrl).subscribe({ error: () => undefined });
    http.get(requestUrl).subscribe({ error: () => undefined });

    const requests = httpTesting.match(requestUrl);
    expect(requests).toHaveLength(2);
    for (const request of requests) {
      expect(request.request.headers.get('Authorization')).toBe('Bearer active-token');
      request.flush(
        { message: 'Unauthorized' },
        { status: 401, statusText: 'Unauthorized' },
      );
    }

    expect(invalidateSession).toHaveBeenCalledTimes(2);
    expect(invalidateSession).toHaveBeenNthCalledWith(1, 'active-token');
    expect(invalidateSession).toHaveBeenNthCalledWith(2, 'active-token');
    expect(toastWarning).toHaveBeenCalledOnce();
    expect(toastWarning).toHaveBeenCalledWith(
      'Tu sesión ha expirado. Inicia sesión nuevamente.',
      6000,
    );
    expect(navigate).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledWith(['/auth/login']);
    expect(toastError).not.toHaveBeenCalled();
  });

  it('should preserve the session when the API returns a transient error', () => {
    const requestUrl = `${environment.apiUrl}/products`;

    http.get(requestUrl).subscribe({ error: () => undefined });
    httpTesting.expectOne(requestUrl).flush(
      { message: 'Service unavailable' },
      { status: 503, statusText: 'Service Unavailable' },
    );

    expect(invalidateSession).not.toHaveBeenCalled();
    expect(toastWarning).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
    expect(toastError).toHaveBeenCalledOnce();
  });
});
