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
}

const initialState: ProductState = {
  products: [],
  selectedProduct: null,
  totalItems: 0,
};

export const ProductStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withRequestStatus(),

  withMethods((store, http = inject(HttpClient)) => {
    const apiUrl = API_ENDPOINTS.PRODUCTS.BASE;

    return {

      // 1. CARGA DE MIS PRODUCTOS (Lectura)
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

      // 2. CREAR PRODUCTO (Escritura con Callbacks)
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

      // 3. BÚSQUEDA y PAGINACIÓN (Lectura con parámetros)
      searchProducts: rxMethod<SearchParams>(
        pipe(
          tap(() => patchState(store, setLoading())),
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
                  ...setLoaded()
                }),
                error: (err: any) => patchState(store, setError('Error en la búsqueda')),
              })
            );
          })
        )
      ),

      // 4. OBTENER POR ID (Lectura individual)
      getProductById: rxMethod<string>(
        pipe(
          tap(() => patchState(store, { selectedProduct: null, ...setLoading() })),
          switchMap((id) =>
            http.get<Product>(`${apiUrl}/${id}`).pipe(
              tapResponse({
                next: (product) => patchState(store, {
                  selectedProduct: product,
                  ...setLoaded()
                }),
                error: (err: any) => patchState(store, setError('Producto no encontrado')),
              })
            )
          )
        )
      ),

      // 5. UTILIDAD (Stateless)
      // Mantenemos este método para consultas independientes (ej. productos similares)
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
