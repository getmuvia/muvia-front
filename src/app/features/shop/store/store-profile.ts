import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { of, Subject } from 'rxjs';
import type { Observable } from 'rxjs';
import { catchError, map, startWith, switchMap } from 'rxjs/operators';
import type { VendorResponse } from '@core/models/user/vendor-profile';
import { UserService } from '@core/services/user/user';
import { TranslatePipe, UiTextPipe } from '@core/services/i18n/translation-pipes';
import { ProductService, PaginatedResponse } from '@core/services/product/product';
import type { ProductSummary } from '@core/models/product/product-summary';
import { MarketService } from '@core/services/market/market';
import { STORE_CONFIG } from '@core/store/store.config';
import { getErrorMessage } from '@core/models/errors/api-error.model';
import { Pagination } from '@shared/components/pagination/pagination';
import { Skeleton } from '@shared/components/loaders/skeleton/skeleton';
import { SellerCoverBanner } from '../../seller/seller-profile/components/seller-cover-banner/seller-cover-banner';
import { SellerProfileHeader } from '../../seller/seller-profile/components/seller-profile-header/seller-profile-header';
import { SellerSidebar } from '../../seller/seller-profile/components/seller-sidebar/seller-sidebar';
import { SellerProductGrid } from '../../seller/seller-profile/components/seller-product-grid/seller-product-grid';

type StoreProfileState =
    | { status: 'loading' }
    | { status: 'ready'; vendor: VendorResponse }
    | { status: 'error'; notFound: boolean };

type StoreProductsState =
    | { status: 'loading' }
    | { status: 'ready'; page: PaginatedResponse<ProductSummary> }
    | { status: 'error'; message: string };

@Component({
    selector: 'app-store-profile',
    imports: [TranslatePipe, UiTextPipe, Skeleton, Pagination,
        SellerCoverBanner, SellerProfileHeader, SellerSidebar, SellerProductGrid],
    templateUrl: './store-profile.html',
    styleUrl: '../../seller/seller-profile/seller-profile.css',
})
export class StoreProfile {
    private readonly route = inject(ActivatedRoute);
    private readonly userService = inject(UserService);
    private readonly productService = inject(ProductService);
    private readonly market = inject(MarketService);
    private readonly retries = new Subject<void>();
    private readonly productRetries = signal(0);
    private productsScope = '';

    readonly state = signal<StoreProfileState>({ status: 'loading' });
    readonly productsState = signal<StoreProductsState>({ status: 'loading' });
    readonly currentProductPage = signal(STORE_CONFIG.PAGINATION.DEFAULT_PAGE);
    readonly hasSidebar = computed(() => {
        const view = this.state();
        if (view.status !== 'ready') return false;
        const profile = view.vendor.vendorProfile;
        return !!profile.aboutMe || !!profile.socialLinks?.length
            || Object.keys(profile.businessHours ?? {}).length > 0;
    });

    constructor() {
        this.route.paramMap.pipe(
            switchMap(params => this.retries.pipe(
                startWith(undefined),
                switchMap(() => this.loadStore(params.get('id'))),
            )),
            takeUntilDestroyed(),
        ).subscribe(state => this.state.set(state));

        effect(onCleanup => {
            const view = this.state();
            const marketCode = this.market.selectedMarket().code;
            if (view.status !== 'ready') {
                this.productsState.set({ status: 'loading' });
                return;
            }

            const scope = `${view.vendor.id}:${marketCode}`;
            if (scope !== this.productsScope) {
                this.productsScope = scope;
                this.currentProductPage.set(STORE_CONFIG.PAGINATION.DEFAULT_PAGE);
            }
            const page = this.currentProductPage();
            this.productRetries();
            this.productsState.set({ status: 'loading' });
            const request = this.productService.searchProducts({
                search: '', sellerId: view.vendor.id, marketCode, page,
                limit: STORE_CONFIG.PAGINATION.DEFAULT_LIMIT,
            }, { errorFeedback: 'local' }).subscribe({
                next: result => {
                    const lastPage = Math.max(1, result.totalPages);
                    if (page > lastPage) {
                        this.currentProductPage.set(lastPage);
                        return;
                    }
                    this.productsState.set({ status: 'ready', page: result });
                },
                error: (error: unknown) => this.productsState.set({
                    status: 'error',
                    message: getErrorMessage(error,
                        'No pudimos cargar los productos de este comercio. Inténtalo nuevamente.'),
                }),
            });
            onCleanup(() => request.unsubscribe());
        });
    }

    private loadStore(id: string | null): Observable<StoreProfileState> {
        this.currentProductPage.set(STORE_CONFIG.PAGINATION.DEFAULT_PAGE);
        if (!id) return of({ status: 'error', notFound: true });
        return this.userService.getPublicVendorProfile(id).pipe(
            map((vendor): StoreProfileState => vendor.vendorProfile
                ? { status: 'ready', vendor }
                : { status: 'error', notFound: true }),
            catchError((error: unknown) => of<StoreProfileState>({
                status: 'error',
                notFound: error instanceof HttpErrorResponse && (error.status === 400 || error.status === 404),
            })),
            startWith<StoreProfileState>({ status: 'loading' }),
        );
    }

    retry(): void {
        this.retries.next();
    }

    retryProducts(): void {
        this.productRetries.update(value => value + 1);
    }

    changeProductPage(page: number): void {
        const products = this.productsState();
        if (products.status === 'ready' && page >= 1 && page <= products.page.totalPages
            && page !== this.currentProductPage()) {
            this.currentProductPage.set(page);
        }
    }
}
