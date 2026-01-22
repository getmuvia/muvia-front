import { inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { tapResponse } from '@ngrx/operators';
import { pipe, tap, switchMap, exhaustMap } from 'rxjs';

import { Product } from '@core/models/product/product';
import { CreateProductDto } from '@core/models/product/create-product.dto';
import { getErrorMessage } from '@core/models/errors/api-error.model';
import { withRequestStatus, setLoading, setLoaded, setError } from '@core/store/features/with-request-status';
import { withPagination } from '@core/store/features/with-pagination';
import { withEntitySelection } from '@core/store/features/with-selection';
import { STORE_CONFIG } from '@core/store/store.config';
import { ProductService, SearchParams, PaginatedResponse } from './product';

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
 * 
 * HTTP calls are delegated to ProductService for separation of concerns.
 */
export const ProductStore = signalStore(
    { providedIn: 'root' },
    withState(initialState),
    withRequestStatus(),
    withPagination(),
    withEntitySelection<Product>(),

    withMethods((store, productService = inject(ProductService)) => {
        return {

            /**
             * Loads the current user's products.
             * Updates `products` state and handles loading/error status automatically.
             */
            loadUserProducts: rxMethod<void>(
                pipe(
                    tap(() => patchState(store, setLoading())),
                    switchMap(() =>
                        productService.getUserProducts().pipe(
                            tapResponse({
                                next: (products) => patchState(store, {
                                    products,
                                    ...setLoaded()
                                }),
                                error: (error: HttpErrorResponse) => patchState(store, setError(getErrorMessage(error, 'Error al cargar productos'))),
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
                        productService.createProduct(dto).pipe(
                            tapResponse({
                                next: (newProduct) => {
                                    patchState(store, (state) => ({
                                        products: [newProduct, ...state.products],
                                    }));
                                    patchState(store, setLoaded());
                                    if (onSuccess) onSuccess();
                                },
                                error: (error: HttpErrorResponse) => {
                                    const errorMsg = getErrorMessage(error, 'No se pudo crear el producto');
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
                        return productService.searchProducts(params).pipe(
                            tapResponse({
                                next: (response) => {
                                    patchState(store, (state) => ({
                                        products: response.page === 1
                                            ? response.data
                                            : [...state.products, ...response.data],
                                        ...setLoaded()
                                    }));
                                    store.setPagination(response);
                                },
                                error: (error: HttpErrorResponse) => patchState(store, setError(getErrorMessage(error, 'Error en la búsqueda'))),
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
                        productService.getProductById(id).pipe(
                            tapResponse({
                                next: (product) => {
                                    store.selectEntity(product);
                                    patchState(store, setLoaded());
                                },
                                error: (error: HttpErrorResponse) => patchState(store, setError(getErrorMessage(error, 'Producto no encontrado'))),
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
                return productService.searchProducts(params);
            },
        };
    })
);
