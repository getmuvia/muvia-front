import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { API_ENDPOINTS } from '@core/constants/api-endpoints';
import { VendorProfile, VendorResponse, UpdateVendorProfilePayload } from '../../models/user/vendor-profile';

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private readonly http = inject(HttpClient);

    readonly vendorProfile = signal<VendorProfile | null>(null);

    updateProfile(data: UpdateVendorProfilePayload): Observable<VendorResponse> {
        return this.http.patch<VendorResponse>(API_ENDPOINTS.USERS.ME, data).pipe(
            tap(updatedUser => {

                if (updatedUser.vendorProfile) {
                    this.vendorProfile.update(current => ({ ...current, ...updatedUser.vendorProfile }));
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
            error: (error: HttpErrorResponse) => console.error('Background profile refresh failed', error)
        });
    }

    getProfile(): Observable<VendorProfile> {
        return this.http.get<VendorProfile>(API_ENDPOINTS.USERS.ME);
    }
}

