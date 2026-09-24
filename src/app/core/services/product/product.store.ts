import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { tapResponse } from '@ngrx/operators';
import { pipe, tap, switchMap, exhaustMap } from 'rxjs';

import type { Product } from '@core/models/product/product';
import type { CreateProductDto } from '@core/models/product/create-product.dto';
import type { UpdateProductDto } from '@core/models/product/update-product.dto';
import {
    toAppError,
    type AppError,
    type NormalizeErrorOptions,
} from '@core/models/errors/api-error.model';
import { withRequestStatus, setLoading, setLoaded, setError } from '@core/store/features/with-request-status';
import { withPagination } from '@core/store/features/with-pagination';
import { withEntitySelection } from '@core/store/features/with-selection';
import { STORE_CONFIG } from '@core/store/store.config';
import { ProductService, type SearchParams } from './product';

interface ProductState {
    products: Product[];
}

const initialState: ProductState = {
    products: [],
};

const EXPECTED_PRODUCT_MUTATION_ERRORS = {
    errorFeedback: 'local',
    errorTelemetry: { expectedStatuses: [400, 409, 422] },
} as const;

const EXPECTED_MISSING_PRODUCT = {
    errorFeedback: 'local',
    errorTelemetry: { expectedStatuses: [404] },
} as const;

const PRODUCT_ERROR_CODE_MESSAGES: Readonly<Record<string, string>> = {
    PRODUCT_LIMIT_REACHED: 'Alcanzaste el límite de productos permitidos.',
};

function normalizeProductError(
    error: unknown,
    fallbackMessage: string,
    statusMessages?: NormalizeErrorOptions['statusMessages'],
): AppError {
    return toAppError(error, {
        fallbackMessage,
        statusMessages,
        codeMessages: PRODUCT_ERROR_CODE_MESSAGES,
    });
}

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
    withState(initialState),
    withRequestStatus<AppError>(),
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
                        productService.getUserProducts({ errorFeedback: 'local' }).pipe(
                            tapResponse({
                                next: (products) => patchState(store, {
                                    products,
                                    ...setLoaded()
                                }),
                                error: (error: unknown) => patchState(
                                    store,
                                    setError(normalizeProductError(
                                        error,
                                        'No pudimos cargar tus productos.',
                                    )),
                                ),
                            })
                        )
                    )
                )
            ),

            /**
             * Creates a new product.
             * - Adds the product to local state after the backend confirms creation.
             * - Accepts callbacks for custom UI handling (modals, toasts).
             */
            createProduct: rxMethod<{
                dto: CreateProductDto;
                onSuccess?: () => void;
                onError?: (error: AppError) => void;
            }>(
                pipe(
                    tap(() => patchState(store, setLoading())),
                    exhaustMap(({ dto, onSuccess, onError }) =>
                        productService.createProduct(dto, EXPECTED_PRODUCT_MUTATION_ERRORS).pipe(
                            tapResponse({
                                next: (newProduct) => {
                                    patchState(store, (state) => ({
                                        products: [newProduct, ...state.products],
                                    }));
                                    patchState(store, setLoaded());
                                    onSuccess?.();
                                },
                                error: (error: unknown) => {
                                    const appError = normalizeProductError(
                                        error,
                                        'No se pudo crear el producto.',
                                    );
                                    patchState(store, setError(appError));
                                    onError?.(appError);
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
                        return productService.searchProducts(params, { errorFeedback: 'local' }).pipe(
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
                                error: (error: unknown) => patchState(
                                    store,
                                    setError(normalizeProductError(
                                        error,
                                        'No pudimos cargar los productos.',
                                    )),
                                ),
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
                        productService.getProductById(id, EXPECTED_MISSING_PRODUCT).pipe(
                            tapResponse({
                                next: (product) => {
                                    store.selectEntity(product);
                                    patchState(store, setLoaded());
                                },
                                error: (error: unknown) => patchState(
                                    store,
                                    setError(normalizeProductError(
                                        error,
                                        'No pudimos cargar el producto.',
                                        { 404: 'Producto no encontrado.' },
                                    )),
                                ),
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
                return productService.searchProducts(params, { errorFeedback: 'none' });
            },

            /**
             * Updates an existing product.
             * - Updates the local product after the backend confirms the change.
             * - Accepts callbacks for custom UI handling.
             */
            updateProduct: rxMethod<{
                id: string;
                dto: UpdateProductDto;
                onSuccess?: () => void;
                onError?: (error: AppError) => void;
            }>(
                pipe(
                    tap(() => patchState(store, setLoading())),
                    exhaustMap(({ id, dto, onSuccess, onError }) =>
                        productService.updateProduct(id, dto, EXPECTED_PRODUCT_MUTATION_ERRORS).pipe(
                            tapResponse({
                                next: (updatedProduct) => {
                                    patchState(store, (state) => ({
                                        products: state.products.map(p =>
                                            p.id === id ? updatedProduct : p
                                        ),
                                    }));
                                    store.selectEntity(updatedProduct);
                                    patchState(store, setLoaded());
                                    onSuccess?.();
                                },
                                error: (error: unknown) => {
                                    const appError = normalizeProductError(
                                        error,
                                        'No se pudo actualizar el producto.',
                                    );
                                    patchState(store, setError(appError));
                                    onError?.(appError);
                                },
                            })
                        )
                    )
                )
            ),
        };
    })
);
