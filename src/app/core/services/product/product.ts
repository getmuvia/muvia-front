import { inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { tapResponse } from '@ngrx/operators';
import { pipe, tap, switchMap, exhaustMap } from 'rxjs';

import { Product } from '@core/models/product/product';
import { CreateProductDto } from '@core/models/product/create-product.dto';
import { API_ENDPOINTS } from '@core/constants/api-endpoints';
import { withRequestStatus, setLoading, setLoaded, setError } from '@core/store/features/with-request-status';
import { withPagination } from '@core/store/features/with-pagination';
import { withEntitySelection } from '@core/store/features/with-selection';
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

interface ProductState {
  products: Product[];
}

const initialState: ProductState = {
  products: [],
};

/**
 * ProductStore
 * Manages the state for Products including user's products, search results, and details.
 * Uses the following features:
 * - `withRequestStatus`: helper for loading/error states.
 * - `withPagination`: helper for handling paginated lists.
 * - `withEntitySelection`: helper for handling a selected product details.
 */
export const ProductStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withRequestStatus(),
  withPagination(),
  withEntitySelection<Product>(),

  withMethods((store, http = inject(HttpClient)) => {
    const apiUrl = API_ENDPOINTS.PRODUCTS.BASE;

    return {

      /**
       * Loads the current user's products.
       * Updates `products` state and handles loading/error status automatically.
       */
      loadUserProducts: rxMethod<void>(
        pipe(
          tap(() => patchState(store, setLoading())),
          switchMap(() =>
            http.get<Product[]>(API_ENDPOINTS.PRODUCTS.MY_PRODUCTS).pipe(
              tapResponse({
                next: (products) => patchState(store, {
                  products,
                  ...setLoaded()
                }),
                error: (err: any) => patchState(store, setError(err?.message || 'Error al cargar productos')),
              })
            )
          )
        )
      ),

      /**
       * Creates a new product.
       * - Optimistically adds the product to the store on success.
       * - Accepts callbacks for custom UI handling (modals, toasts).
       */
      createProduct: rxMethod<{
        dto: CreateProductDto;
        onSuccess?: () => void;
        onError?: (message: string) => void;
      }>(
        pipe(
          tap(() => patchState(store, setLoading())),
          exhaustMap(({ dto, onSuccess, onError }) =>
            http.post<Product>(apiUrl, dto).pipe(
              tapResponse({
                next: (newProduct) => {
                  patchState(store, (state) => ({
                    products: [newProduct, ...state.products],
                  }));
                  patchState(store, setLoaded());
                  if (onSuccess) onSuccess();
                },
                error: (err: any) => {
                  const errorMsg = err?.error?.message || 'No se pudo crear el producto';
                  patchState(store, setError(errorMsg));
                  if (onError) onError(errorMsg);
                },
              })
            )
          )
        )
      ),

      /**
       * Searches products with pagination.
       * - Updates `products` list.
       * - Updates `pagination` state via `withPagination`.
       */
      searchProducts: rxMethod<SearchParams>(
        pipe(
          tap((params) => {
            const page = params.page || STORE_CONFIG.PAGINATION.DEFAULT_PAGE;
            patchState(store, (state) => ({
              ...setLoading(),
              products: page === 1 ? [] : state.products
            }));
          }),
          switchMap((params) => {
            const page = params.page || STORE_CONFIG.PAGINATION.DEFAULT_PAGE;
            const queryParams = new HttpParams()
              .set('search', params.search)
              .set('page', page.toString())
              .set('limit', (params.limit || STORE_CONFIG.PAGINATION.DEFAULT_LIMIT).toString());

            return http.get<PaginatedResponse<Product>>(apiUrl, { params: queryParams }).pipe(
              tapResponse({
                next: (response) => {
                  patchState(store, (state) => ({
                    // Intelligent State Update:
                    // If page is 1, we replace the list (new search/filter).
                    // If page > 1, we append new products to the existing list (infinite scroll).
                    products: response.page === 1
                      ? response.data
                      : [...state.products, ...response.data],
                    ...setLoaded()
                  }));
                  store.setPagination(response);
                },
                error: (err: any) => patchState(store, setError('Error en la búsqueda')),
              })
            );
          })
        )
      ),

      /**
       * Fetches a single product by ID.
       * - Clears previous selection first.
       * - Updates `selectedEntity` via `withEntitySelection`.
       */
      getProductById: rxMethod<string>(
        pipe(
          tap(() => {
            store.clearSelection();
            patchState(store, setLoading());
          }),
          switchMap((id) =>
            http.get<Product>(`${apiUrl}/${id}`).pipe(
              tapResponse({
                next: (product) => {
                  store.selectEntity(product);
                  patchState(store, setLoaded());
                },
                error: (err: any) => patchState(store, setError('Producto no encontrado')),
              })
            )
          )
        )
      ),

      /**
       * Stateless Utility: Fetches products without affecting the store.
       * Useful for independent queries like "Related Products".
       */
      getAllProducts: (params: SearchParams = { search: '' }) => {
        let queryParams = new HttpParams()
          .set('page', (params.page || STORE_CONFIG.PAGINATION.DEFAULT_PAGE).toString())
          .set('limit', (params.limit || STORE_CONFIG.PAGINATION.DEFAULT_LIMIT).toString());

        if (params.search) {
          queryParams = queryParams.set('search', params.search);
        }

        return http.get<PaginatedResponse<Product>>(apiUrl, { params: queryParams });
      },
    };
  })
);
