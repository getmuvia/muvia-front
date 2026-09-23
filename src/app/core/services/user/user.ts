import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { finalize, Observable, Subscription, tap } from 'rxjs';
import { API_ENDPOINTS } from '@core/constants/api-endpoints';
import {
  VendorProfile,
  VendorResponse,
  UpdateVendorProfilePayload,
} from '../../models/user/vendor-profile';
import type { User } from '../../auth/models/auth.models';
import { LoggerService } from '../logger/logger';
import { createHttpErrorFeedbackContext } from '@core/models/errors/http-error-feedback';
import { getErrorMessage } from '@core/models/errors/api-error.model';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly logger = inject(LoggerService);
  private vendorProfileRequest: Subscription | null = null;

  private readonly _vendorProfile = signal<VendorProfile | null>(null);
  readonly vendorProfile = this._vendorProfile.asReadonly();
  private readonly _isVendorProfileLoading = signal(false);
  readonly isVendorProfileLoading = this._isVendorProfileLoading.asReadonly();
  private readonly _vendorProfileError = signal<string | null>(null);
  readonly vendorProfileError = this._vendorProfileError.asReadonly();

  updateProfile(data: UpdateVendorProfilePayload): Observable<User> {
    return this.http
      .patch<User>(API_ENDPOINTS.USERS.ME, data, {
        context: createHttpErrorFeedbackContext('local'),
      })
      .pipe(
        tap((updatedUser) => {
          if (updatedUser.vendorProfile) {
            this._vendorProfile.set(updatedUser.vendorProfile);
          }
        }),
      );
  }

  getVendorProfile(userId: string): Observable<VendorResponse> {
    return this.http
      .get<VendorResponse>(`${API_ENDPOINTS.USERS.VENDOR}/${userId}`, {
        context: createHttpErrorFeedbackContext('none'),
      })
      .pipe(
        tap((response) => {
          this._vendorProfile.set(response.vendorProfile);
        }),
      );
  }

  /**
   * Stale-While-Revalidate strategy for loading profile
   */
  loadVendorProfile(userId: string): void {
    this.vendorProfileRequest?.unsubscribe();
    this._isVendorProfileLoading.set(true);
    this._vendorProfileError.set(null);

    this.vendorProfileRequest = this.getVendorProfile(userId)
      .pipe(
        finalize(() => {
          this._isVendorProfileLoading.set(false);
          this.vendorProfileRequest = null;
        }),
      )
      .subscribe({
        error: (error: HttpErrorResponse) => {
          this.logger.error('Background profile refresh failed', error, 'UserService');
          this._vendorProfileError.set(
            getErrorMessage(error, 'No pudimos cargar la información de tu negocio.'),
          );
        },
      });
  }

  getProfile(): Observable<User> {
    return this.http.get<User>(API_ENDPOINTS.USERS.ME);
  }

  clearProfile(): void {
    this.vendorProfileRequest?.unsubscribe();
    this.vendorProfileRequest = null;
    this._vendorProfile.set(null);
    this._isVendorProfileLoading.set(false);
    this._vendorProfileError.set(null);
  }
}
