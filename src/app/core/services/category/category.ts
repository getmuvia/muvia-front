import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Auth } from '@core/auth/services/auth';
import { Category } from '@core/models/category/category';
import { API_ENDPOINTS } from '@core/constants/api-endpoints';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(Auth);
  private readonly apiUrl = API_ENDPOINTS.CATEGORIES.BASE;

  private getAuthHeaders(): HttpHeaders {
    const token = this.auth.getAccessToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Get all categories.
   * TODO: Implement actual API call when backend endpoint is ready
   */
  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(this.apiUrl, {
      headers: this.getAuthHeaders()
    });
  }
}
