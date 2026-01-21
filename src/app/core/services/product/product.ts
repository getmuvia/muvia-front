import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Product } from '@core/models/product/product';
import { CreateProductDto } from '@core/models/product/create-product.dto';
import { API_ENDPOINTS } from '@core/constants/api-endpoints';
import { STORE_CONFIG } from '@core/store/store.config';

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface SearchParams extends PaginationParams {
  search: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * ProductService
 * HTTP service for product-related API calls.
 * Stateless - does not manage any state, just returns observables.
 */
@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = API_ENDPOINTS.PRODUCTS.BASE;

  /**
   * Get all products for the current user.
   */
  getUserProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(API_ENDPOINTS.PRODUCTS.MY_PRODUCTS);
  }

  /**
   * Create a new product.
   */
  createProduct(dto: CreateProductDto): Observable<Product> {
    return this.http.post<Product>(this.apiUrl, dto);
  }

  /**
   * Search products with pagination.
   */
  searchProducts(params: SearchParams): Observable<PaginatedResponse<Product>> {
    let queryParams = new HttpParams()
      .set('page', (params.page || STORE_CONFIG.PAGINATION.DEFAULT_PAGE).toString())
      .set('limit', (params.limit || STORE_CONFIG.PAGINATION.DEFAULT_LIMIT).toString());

    if (params.search) {
      queryParams = queryParams.set('search', params.search);
    }

    return this.http.get<PaginatedResponse<Product>>(this.apiUrl, { params: queryParams });
  }

  /**
   * Get a product by ID.
   */
  getProductById(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/${id}`);
  }
}

