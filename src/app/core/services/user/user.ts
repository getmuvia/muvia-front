import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '@core/constants/api-endpoints';
import { VendorProfile, VendorResponse, UpdateVendorProfilePayload } from '../../models/user/vendor-profile';
import { Auth } from '@core/auth/services/auth';

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private http = inject(HttpClient);
    private auth = inject(Auth);

    updateProfile(data: UpdateVendorProfilePayload): Observable<VendorProfile> {
        const token = this.auth.getAccessToken();
        const headers = { Authorization: `Bearer ${token}` };
        return this.http.patch<VendorProfile>(API_ENDPOINTS.USERS.ME, data, { headers });
    }

    getVendorProfile(userId: string): Observable<VendorResponse> {
        return this.http.get<VendorResponse>(`${API_ENDPOINTS.USERS.VENDOR}/${userId}`);
    }

    // Placeholder to get current profile if separate from auth
    getProfile(): Observable<VendorProfile> {
        return this.http.get<VendorProfile>(API_ENDPOINTS.USERS.ME);
    }
}
