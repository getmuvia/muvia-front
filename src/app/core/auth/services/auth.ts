import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom, timeout } from 'rxjs';
import {
  AuthResponse,
  LoginData,
  RegisterData,
  USER_ROLES,
  User,
} from '../models/auth.models';
import { AuthStorageService } from './storage';
import { AuthStateService } from './auth-state';
import { parseAuthError } from './auth-error';
import { API_ENDPOINTS } from '@core/constants/api-endpoints';
import { UserService } from '@core/services/user/user';
import { createHttpErrorFeedbackContext } from '@core/models/errors/http-error-feedback';
import { SILENT_SESSION_CHECK } from '../models/auth-http-context';

const SESSION_VERIFICATION_TIMEOUT_MS = 5000;

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly storage = inject(AuthStorageService);
  private readonly state = inject(AuthStateService);
  private readonly userService = inject(UserService);

  readonly currentUser = this.state.currentUser;
  readonly isAuthenticated = this.state.isAuthenticated;
  readonly isLoading = this.state.isLoading;
  readonly error = this.state.error;
  readonly sessionStatus = this.state.sessionStatus;
  readonly isSessionVerified = this.state.isSessionVerified;

  private sessionVersion = 0;
  private verifiedToken: string | null = null;
  private pendingVerification: {
    token: string;
    version: number;
    promise: Promise<boolean>;
  } | null = null;

  constructor() {
    this.restoreSession();
  }

  /**
   * Login with credentials.
   */
  async login(credentials: LoginData): Promise<boolean> {
    this.state.setLoading(true);
    this.state.clearError();

    try {
      const response = await firstValueFrom(
        this.http.post<AuthResponse>(API_ENDPOINTS.AUTH.LOGIN, credentials, {
          context: createHttpErrorFeedbackContext('local', {
            expectedStatuses: [400, 401, 422],
          }),
        })
      );
      this.handleSuccess(response);
      return true;
    } catch (error) {
      this.state.setError(parseAuthError(error));
      return false;
    } finally {
      this.state.setLoading(false);
    }
  }

  /**
   * Register a new user.
   */
  async register(data: RegisterData): Promise<boolean> {
    this.state.setLoading(true);
    this.state.clearError();

    try {
      const response = await firstValueFrom(
        this.http.post<AuthResponse>(API_ENDPOINTS.AUTH.REGISTER, data, {
          context: createHttpErrorFeedbackContext('local', {
            expectedStatuses: [400, 409, 422],
          }),
        })
      );
      this.handleSuccess(response);
      return true;
    } catch (error) {
      this.state.setError(parseAuthError(error));
      return false;
    } finally {
      this.state.setLoading(false);
    }
  }

  /**
   * Logout the current user.
   */
  logout(): void {
    this.sessionVersion++;
    this.verifiedToken = null;
    this.pendingVerification = null;
    this.state.reset();
    this.userService.clearProfile();
    this.storage.clear();
  }

  /**
   * Invalidates the session only when the failed request used the token that is
   * still active. This makes concurrent 401 responses idempotent and prevents a
   * late response from an older token from logging out a newly authenticated
   * session.
   */
  invalidateSession(failedToken: string): boolean {
    if (!failedToken || this.storage.getToken() !== failedToken) {
      return false;
    }

    this.logout();
    return true;
  }

  /**
   * Clear any error state.
   */
  clearError(): void {
    this.state.clearError();
  }

  /**
   * Get the stored access token.
   */
  getAccessToken(): string | null {
    return this.storage.getToken();
  }

  /**
   * Return the landing route appropriate for the authenticated user's role.
   */
  getPostAuthRoute(): string {
    return this.currentUser()?.role === USER_ROLES.VENDOR ? '/seller' : '/home';
  }

  private handleSuccess(response: AuthResponse): void {
    this.sessionVersion++;
    this.pendingVerification = null;
    this.state.setUser(response.user);
    this.storage.store(response.accessToken, response.user);
    this.verifiedToken = response.accessToken;
    this.state.setSessionStatus('verified');
  }

  private restoreSession(): void {
    if (this.storage.hasSession()) {
      const user = this.storage.getUser();
      if (user) {
        this.state.setUser(user);
        this.state.setSessionStatus('unverified');
      }
    }
  }

  /**
   * Verify the current session with the backend.
   * A confirmed 401 invalidates the active token. Transient failures preserve
   * the stored credentials but do not grant access to protected routes.
   * Initializers and guards share the same in-flight verification.
   */
  verifySession(): Promise<boolean> {
    const token = this.storage.getToken();
    if (!token) {
      return Promise.resolve(false);
    }

    if (this.hasVerifiedSession()) return Promise.resolve(true);
    if (this.pendingVerification?.token === token
        && this.pendingVerification.version === this.sessionVersion) {
      return this.pendingVerification.promise;
    }

    const version = this.sessionVersion;
    this.state.setSessionStatus('verifying');
    const promise = this.checkSession(token, version);
    this.pendingVerification = { token, version, promise };
    void promise.then(() => {
      if (this.pendingVerification?.promise === promise) {
        this.pendingVerification = null;
      }
    });
    return promise;
  }

  private async checkSession(token: string, version: number): Promise<boolean> {
    try {
      const user = await firstValueFrom(
        this.http.get<User>(API_ENDPOINTS.USERS.ME, {
          context: createHttpErrorFeedbackContext('none', { expectedStatuses: [401] })
            .set(SILENT_SESSION_CHECK, true),
          transferCache: false,
        }).pipe(timeout({ first: SESSION_VERIFICATION_TIMEOUT_MS }))
      );
      if (!this.isCurrentSession(token, version)) return this.hasVerifiedSession();
      this.state.setUser(user);
      this.storage.store(token, user);
      this.verifiedToken = token;
      this.state.setSessionStatus('verified');
      return true;
    } catch (error) {
      if (!this.isCurrentSession(token, version)) return this.hasVerifiedSession();
      if (error instanceof HttpErrorResponse && error.status === 401) {
        this.invalidateSession(token);
        return false;
      }

      this.state.setSessionStatus('unavailable');
      return false;
    }
  }

  private isCurrentSession(token: string, version: number): boolean {
    return this.sessionVersion === version && this.storage.getToken() === token;
  }

  private hasVerifiedSession(): boolean {
    return this.isSessionVerified() && this.storage.getToken() === this.verifiedToken;
  }
}
