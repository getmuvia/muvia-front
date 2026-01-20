import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { API_ENDPOINTS } from '@core/constants/api-endpoints';
import { VendorProfile, VendorResponse, UpdateVendorProfilePayload } from '../../models/user/vendor-profile';
import { Auth } from '@core/auth/services/auth';

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private http = inject(HttpClient);
    private auth = inject(Auth);

    readonly vendorProfile = signal<VendorProfile | null>(null);

    updateProfile(data: UpdateVendorProfilePayload): Observable<VendorResponse> {
        const token = this.auth.getAccessToken();
        const headers = { Authorization: `Bearer ${token}` };
        return this.http.patch<VendorResponse>(API_ENDPOINTS.USERS.ME, data, { headers }).pipe(
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
            error: (err) => console.error('Background profile refresh failed', err)
        });
    }

    getProfile(): Observable<VendorProfile> {
        return this.http.get<VendorProfile>(API_ENDPOINTS.USERS.ME);
    }
}

