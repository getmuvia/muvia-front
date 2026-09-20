import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Product } from '@core/models/product/product';
import { CreateProductDto } from '@core/models/product/create-product.dto';
import { UpdateProductDto } from '@core/models/product/update-product.dto';
import { API_ENDPOINTS } from '@core/constants/api-endpoints';
import { STORE_CONFIG } from '@core/store/store.config';
import { MarketService } from '@core/services/market/market';
import { ProductDimension } from '@core/models/product/product-dimension-filter';
import {
  createHttpErrorFeedbackContext,
  HttpErrorFeedbackOptions,
} from '@core/models/errors/http-error-feedback';

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface SearchParams extends PaginationParams {
  search: string;
  marketCode?: string;
  categoryId?: string;
  dimension?: ProductDimension;
  maxDimensionCm?: number;
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
  private readonly marketService = inject(MarketService);

  /**
   * Get all products for the current user.
   */
  getUserProducts(options: HttpErrorFeedbackOptions = {}): Observable<Product[]> {
    return this.http.get<Product[]>(API_ENDPOINTS.PRODUCTS.MY_PRODUCTS, {
      context: createHttpErrorFeedbackContext(
        options.errorFeedback ?? 'global',
        options.errorTelemetry,
      ),
    });
  }

  /**
   * Create a new product.
   */
  createProduct(dto: CreateProductDto, options: HttpErrorFeedbackOptions = {}): Observable<Product> {
    return this.http.post<Product>(this.apiUrl, dto, {
      context: createHttpErrorFeedbackContext(
        options.errorFeedback ?? 'global',
        options.errorTelemetry,
      ),
    });
  }

  /**
   * Search products with pagination.
   */
  searchProducts(
    params: SearchParams,
    options: HttpErrorFeedbackOptions = {},
  ): Observable<PaginatedResponse<Product>> {
    let queryParams = new HttpParams()
      .set('page', (params.page || STORE_CONFIG.PAGINATION.DEFAULT_PAGE).toString())
      .set('limit', (params.limit || STORE_CONFIG.PAGINATION.DEFAULT_LIMIT).toString())
      .set('marketCode', params.marketCode ?? this.marketService.selectedMarket().code);

    if (params.search) {
      queryParams = queryParams.set('search', params.search);
    }

    if (params.categoryId) {
      queryParams = queryParams.set('categoryId', params.categoryId);
    }

    if (params.dimension && params.maxDimensionCm !== undefined) {
      queryParams = queryParams
        .set('dimension', params.dimension)
        .set('maxDimensionCm', params.maxDimensionCm.toString());
    }

    return this.http.get<PaginatedResponse<Product>>(this.apiUrl, {
      context: createHttpErrorFeedbackContext(
        options.errorFeedback ?? 'global',
        options.errorTelemetry,
      ),
      params: queryParams,
      // Product data changes independently from the statically deployed frontend.
      // Do not hydrate the catalog from a response captured during prerendering.
      transferCache: false,
    });
  }

  /**
   * Get a product by ID.
   */
  getProductById(id: string, options: HttpErrorFeedbackOptions = {}): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/${id}`, {
      context: createHttpErrorFeedbackContext(
        options.errorFeedback ?? 'global',
        options.errorTelemetry,
      ),
    });
  }

  /**
   * Update an existing product.
   */
  updateProduct(
    id: string,
    dto: UpdateProductDto,
    options: HttpErrorFeedbackOptions = {},
  ): Observable<Product> {
    return this.http.patch<Product>(`${this.apiUrl}/${id}`, dto, {
      context: createHttpErrorFeedbackContext(
        options.errorFeedback ?? 'global',
        options.errorTelemetry,
      ),
    });
  }
}

