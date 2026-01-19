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

    // State
    readonly vendorProfile = signal<VendorProfile | null>(null);

    updateProfile(data: UpdateVendorProfilePayload): Observable<VendorProfile> {
        const token = this.auth.getAccessToken();
        const headers = { Authorization: `Bearer ${token}` };
        return this.http.patch<VendorProfile>(API_ENDPOINTS.USERS.ME, data, { headers }).pipe(
            tap(updatedProfile => {
                // Optimistic update / Sync state
                this.vendorProfile.update(current => ({ ...current, ...updatedProfile } as VendorProfile));
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
        // We already have data? Great, the component can use it immediately.
        // But we ALWAYS fetch fresh data in the background.
        this.getVendorProfile(userId).subscribe({
            error: (err) => console.error('Background profile refresh failed', err)
        });
    }

    // Placeholder to get current profile if separate from auth
    getProfile(): Observable<VendorProfile> {
        return this.http.get<VendorProfile>(API_ENDPOINTS.USERS.ME);
    }
}

