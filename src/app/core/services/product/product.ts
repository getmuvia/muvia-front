import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Auth } from '@core/auth/services/auth';
import { Product } from '@core/models/product/product';
import { CreateProductDto } from '@core/models/product/create-product.dto';
import { API_ENDPOINTS } from '@core/constants/api-endpoints';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(Auth);
  private readonly apiUrl = API_ENDPOINTS.PRODUCTS.BASE;

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
    return this.http.get<Product[]>(API_ENDPOINTS.PRODUCTS.MY_PRODUCTS, {
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
