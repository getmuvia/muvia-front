import { inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { tapResponse } from '@ngrx/operators';
import { pipe, tap, switchMap, exhaustMap } from 'rxjs';

import { Product } from '@core/models/product/product';
import { CreateProductDto } from '@core/models/product/create-product.dto';
import { API_ENDPOINTS } from '@core/constants/api-endpoints';

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
  selectedProduct: Product | null;
  totalItems: number;
  isLoading: boolean;
  error: string | null;
}

const initialState: ProductState = {
  products: [],
  selectedProduct: null,
  totalItems: 0,
  isLoading: false,
  error: null,
};

export const ProductStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),

  withMethods((store, http = inject(HttpClient)) => {
    const apiUrl = API_ENDPOINTS.PRODUCTS.BASE;

    return {

      // 1. CARGA DE MIS PRODUCTOS (Lectura)
      loadUserProducts: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { isLoading: true, error: null })),
          switchMap(() =>
            http.get<Product[]>(API_ENDPOINTS.PRODUCTS.MY_PRODUCTS).pipe(
              tapResponse({
                next: (products) => patchState(store, {
                  products,
                  isLoading: false
                }),
                error: (err: any) => patchState(store, {
                  isLoading: false,
                  error: err?.message || 'Error al cargar productos'
                }),
              })
            )
          )
        )
      ),

      // 2. CREAR PRODUCTO (Escritura con Callbacks)
      createProduct: rxMethod<{
        dto: CreateProductDto;
        onSuccess?: () => void;
        onError?: (message: string) => void;
      }>(
        pipe(
          tap(() => patchState(store, { isLoading: true, error: null })),
          // exhaustMap ignora nuevos clics mientras este se procesa (Evita duplicados)
          exhaustMap(({ dto, onSuccess, onError }) =>
            http.post<Product>(apiUrl, dto).pipe(
              tapResponse({
                next: (newProduct) => {
                  patchState(store, (state) => ({
                    products: [newProduct, ...state.products],
                    isLoading: false
                  }));
                  if (onSuccess) onSuccess();
                },
                error: (err: any) => {
                  const errorMsg = err?.error?.message || 'No se pudo crear el producto';
                  patchState(store, {
                    isLoading: false,
                    error: errorMsg
                  });
                  if (onError) onError(errorMsg);
                },
              })
            )
          )
        )
      ),

      // 3. BÚSQUEDA y PAGINACIÓN (Lectura con parámetros)
      searchProducts: rxMethod<SearchParams>(
        pipe(
          tap(() => patchState(store, { isLoading: true, error: null })),
          switchMap((params) => {
            const queryParams = new HttpParams()
              .set('search', params.search)
              .set('page', (params.page || 1).toString())
              .set('limit', (params.limit || 15).toString());

            return http.get<PaginatedResponse<Product>>(apiUrl, { params: queryParams }).pipe(
              tapResponse({
                next: (response) => patchState(store, {
                  products: response.data,
                  totalItems: response.total,
                  isLoading: false
                }),
                error: (err: any) => patchState(store, {
                  isLoading: false,
                  error: 'Error en la búsqueda'
                }),
              })
            );
          })
        )
      ),

      // 4. OBTENER POR ID (Lectura individual)
      getProductById: rxMethod<string>(
        pipe(
          tap(() => patchState(store, { isLoading: true, selectedProduct: null, error: null })),
          switchMap((id) =>
            http.get<Product>(`${apiUrl}/${id}`).pipe(
              tapResponse({
                next: (product) => patchState(store, {
                  selectedProduct: product,
                  isLoading: false
                }),
                error: (err: any) => patchState(store, {
                  isLoading: false,
                  error: 'Producto no encontrado'
                }),
              })
            )
          )
        )
      ),

      // 5. UTILIDAD (Stateless)
      // Mantenemos este método para consultas independientes (ej. productos similares) 
      // Public Stateless Methods (kept as utility methods on the store)
      getAllProducts: (params: SearchParams = { search: '' }) => {
        let queryParams = new HttpParams()
          .set('page', (params.page || 1).toString())
          .set('limit', (params.limit || 10).toString());

        if (params.search) {
          queryParams = queryParams.set('search', params.search);
        }

        return http.get<PaginatedResponse<Product>>(apiUrl, { params: queryParams });
      },
    };
  })
);
