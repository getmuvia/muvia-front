import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
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
    this.state.setUser(response.user);
    this.storage.store(response.accessToken, response.user);
  }

  private restoreSession(): void {
    if (this.storage.hasSession()) {
      const user = this.storage.getUser();
      if (user) {
        this.state.setUser(user);
      }
    }
  }

  /**
   * Verify the current session with the backend.
   * A confirmed 401 invalidates the active token. Transient failures preserve
   * the restored local session so a temporary outage does not force a login.
   */
  async verifySession(): Promise<boolean> {
    const token = this.storage.getToken();
    if (!token) {
      return false;
    }

    try {
      const user = await firstValueFrom(
        this.http.get<User>(API_ENDPOINTS.USERS.ME)
      );
      this.state.setUser(user);
      this.storage.store(token, user);
      return true;
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        this.invalidateSession(token);
        return false;
      }

      return this.isAuthenticated();
    }
  }
}
