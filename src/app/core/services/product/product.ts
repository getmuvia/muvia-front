import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { Auth } from '@core/auth/services/auth';
import { Product } from '@core/models/product/product';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(Auth);
  private readonly apiUrl = `${environment.apiUrl}/products`;

  /**
   * Get products of the authenticated user.
   * Requires valid authentication token.
   */
  getUserProducts(): Observable<Product[]> {
    const token = this.auth.getAccessToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<Product[]>(`${this.apiUrl}/my-products`, { headers });
  }
}
