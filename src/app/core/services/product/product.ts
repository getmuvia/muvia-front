import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Auth } from '@core/auth/services/auth';
import { Product } from '@core/models/product/product';
import { CreateProductDto } from '@core/models/product/create-product.dto';
import { API_ENDPOINTS } from '@core/constants/api-endpoints';

/**
 * Pagination parameters for product queries
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

/**
 * Search parameters extending pagination
 */
export interface SearchParams extends PaginationParams {
  search: string;
}

/**
 * Paginated response from the API
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

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
   * Get all products with pagination (public endpoint)
   * GET /products?page=1&limit=10
   */
  getAllProducts(params: PaginationParams = {}): Observable<PaginatedResponse<Product>> {
    const queryParams = new HttpParams()
      .set('page', (params.page || 1).toString())
      .set('limit', (params.limit || 10).toString());

    return this.http.get<PaginatedResponse<Product>>(this.apiUrl, { params: queryParams });
  }

  /**
   * Search products by text with pagination (public endpoint)
   * GET /products?search=zapatos&page=1&limit=15
   */
  searchProducts(params: SearchParams): Observable<PaginatedResponse<Product>> {
    const queryParams = new HttpParams()
      .set('search', params.search)
      .set('page', (params.page || 1).toString())
      .set('limit', (params.limit || 15).toString());

    return this.http.get<PaginatedResponse<Product>>(this.apiUrl, { params: queryParams });
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

  /**
   * Get a product by its ID (public endpoint)
   * GET /products/:id
   */
  getProductById(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/${id}`);
  }
}

