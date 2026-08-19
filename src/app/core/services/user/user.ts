import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { API_ENDPOINTS } from '@core/constants/api-endpoints';
import { VendorProfile, VendorResponse, UpdateVendorProfilePayload } from '../../models/user/vendor-profile';
import type { User } from '../../auth/models/auth.models';
import { LoggerService } from '../logger/logger';

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private readonly http = inject(HttpClient);
    private readonly logger = inject(LoggerService);

    readonly vendorProfile = signal<VendorProfile | null>(null);

    updateProfile(data: UpdateVendorProfilePayload): Observable<User> {
        return this.http.patch<User>(API_ENDPOINTS.USERS.ME, data).pipe(
            tap(updatedUser => {

                if (updatedUser.vendorProfile) {
                    this.vendorProfile.set(updatedUser.vendorProfile);
                }
            })
        );
    }

    getVendorProfile(userId: string): Observable<VendorResponse> {
        return this.http.get<VendorResponse>(`${API_ENDPOINTS.USERS.VENDOR}/${userId}`).pipe(
            tap(response => {
                this.vendorProfile.set(response.vendorProfile);
            })
        );
    }

    /**
     * Stale-While-Revalidate strategy for loading profile
     */
    loadVendorProfile(userId: string): void {
        this.getVendorProfile(userId).subscribe({
            error: (error: HttpErrorResponse) => {
                this.logger.error('Background profile refresh failed', error, 'UserService');
            }
        });
    }

    getProfile(): Observable<User> {
        return this.http.get<User>(API_ENDPOINTS.USERS.ME);
    }
}


