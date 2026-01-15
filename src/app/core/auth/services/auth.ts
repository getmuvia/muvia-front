import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { LoginData, RegisterData, AuthResponse } from '../models/auth.models';
import { AuthStorage } from './storage';
import { AuthState } from './auth-state';
import { parseAuthError } from './auth-error';
import { API_ENDPOINTS } from '@core/constants/api-endpoints';

@Injectable({
  providedIn: 'root'
})
export class Auth {
  private readonly http = inject(HttpClient);
  private readonly storage = inject(AuthStorage);
  private readonly state = inject(AuthState);

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
        this.http.post<AuthResponse>(API_ENDPOINTS.AUTH.LOGIN, credentials)
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
        this.http.post<AuthResponse>(API_ENDPOINTS.AUTH.REGISTER, data)
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
    this.storage.clear();
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
   * Returns true if valid, false (and logs out) if invalid.
   */
  async verifySession(): Promise<boolean> {
    if (!this.storage.hasSession()) {
      return false;
    }

    try {
      const response = await firstValueFrom(
        this.http.get<AuthResponse>(API_ENDPOINTS.AUTH.CHECK_STATUS)
      );
      this.handleSuccess(response);
      return true;
    } catch {
      this.logout();
      return false;
    }
  }
}
