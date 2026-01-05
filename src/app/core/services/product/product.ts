import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { Auth } from '@core/auth/services/auth';
import { Product } from '@core/models/product/product';
import { CreateProductDto } from '@core/models/product/create-product.dto';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(Auth);
  private readonly apiUrl = `${environment.apiUrl}/products`;

  private getAuthHeaders(): HttpHeaders {
    const token = this.auth.getAccessToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Get products of the authenticated user.
   * Requires valid authentication token.
   */
  getUserProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/my-products`, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Create a new product.
   * Requires valid authentication token.
   */
  createProduct(dto: CreateProductDto): Observable<Product> {
    return this.http.post<Product>(this.apiUrl, dto, {
      headers: this.getAuthHeaders()
    });
  }
}
