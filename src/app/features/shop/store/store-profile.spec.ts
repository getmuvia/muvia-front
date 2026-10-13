import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { API_ENDPOINTS } from '@core/constants/api-endpoints';
import { MarketService } from '@core/services/market/market';
import { StoreProfile } from './store-profile';

describe('Public StoreProfile', () => {
    let fixture: ComponentFixture<StoreProfile>;
    let http: HttpTestingController;
    let params: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
    let selectedMarket: ReturnType<typeof signal<{ code: string }>>;
    const response = {
        id: 'store-one', role: 'vendor', createdAt: '',
        vendorProfile: {
            businessName: 'Store one', description: 'Furniture made locally',
            aboutMe: 'A family workshop', offersRepairs: true, repairScope: 'Tapizado',
            repairsExternalProducts: true,
            businessHours: { monday: { open: '09:00', close: '18:00' } },
            socialLinks: [{ name: 'Website', icon: 'language', url: 'https://example.com' }],
        },
    };
    const product = {
        id: 'product-one', title: 'Chair', price: 100, currencyCode: 'BOB',
        primaryImage: null, category: null,
    };

    const catalogRequest = (sellerId = 'store-one', page = 1, marketCode = 'BO') => {
        const request = http.expectOne(req => req.url === API_ENDPOINTS.PRODUCTS.BASE);
        expect(request.request.params.get('sellerId')).toBe(sellerId);
        expect(request.request.params.get('page')).toBe(String(page));
        expect(request.request.params.get('marketCode')).toBe(marketCode);
        expect(request.request.params.get('limit')).toBe('10');
        return request;
    };

    const loadStore = (total = 1) => {
        http.expectOne(`${API_ENDPOINTS.USERS.VENDOR}/store-one`).flush(response);
        fixture.detectChanges();
        catalogRequest().flush({
            data: total ? [product] : [], total, page: 1, limit: 10, totalPages: Math.ceil(total / 10),
        });
        fixture.detectChanges();
    };

    beforeEach(() => {
        params = new BehaviorSubject(convertToParamMap({ id: 'store-one' }));
        selectedMarket = signal({ code: 'BO' });
        TestBed.configureTestingModule({
            imports: [StoreProfile],
            providers: [provideHttpClient(), provideHttpClientTesting(), {
                provide: ActivatedRoute, useValue: { paramMap: params.asObservable() },
            }, {
                provide: MarketService,
                useValue: { selectedMarket, locale: signal('es-BO') },
            }],
        });
        http = TestBed.inject(HttpTestingController);
        fixture = TestBed.createComponent(StoreProfile);
        fixture.detectChanges();
    });

    afterEach(() => http.verify());

    it('shows the full profile and published products without edit controls or a session', () => {
        expect(fixture.nativeElement.querySelector('[aria-busy="true"]')).not.toBeNull();
        loadStore();
        const element = fixture.nativeElement as HTMLElement;
        expect(element.querySelector('h1')?.textContent?.trim()).toBe('Store one');
        expect(element.querySelector('[data-repair-badge]')).not.toBeNull();
        expect(element.querySelector('app-seller-sidebar')?.textContent).toContain('A family workshop');
        expect(element.querySelector('app-seller-sidebar')?.textContent).toContain('09:00');
        expect(element.querySelector('a[href="https://example.com"]')).not.toBeNull();
        expect(element.querySelector('app-product-card h3')?.textContent?.trim()).toBe('Chair');
        expect(element.querySelector('a[href="/products/product-one"]')).not.toBeNull();
        expect(element.querySelector('app-edit-trigger-button')).toBeNull();
        expect(element.querySelector('a[href*="/seller/"]')).toBeNull();
        expect(element.querySelector('button')).toBeNull();
    });

    it('keeps pagination scoped to the store and resets it after changing market', () => {
        loadStore(12);
        fixture.componentInstance.changeProductPage(2);
        fixture.detectChanges();
        catalogRequest('store-one', 2).flush({
            data: [{ ...product, id: 'product-two', title: 'Table' }],
            total: 12, page: 2, limit: 10, totalPages: 2,
        });
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector('h3').textContent.trim()).toBe('Table');
        selectedMarket.set({ code: 'PE' });
        fixture.detectChanges();
        catalogRequest('store-one', 1, 'PE').flush({
            data: [], total: 0, page: 1, limit: 10, totalPages: 0,
        });
        fixture.detectChanges();
        expect(fixture.componentInstance.currentProductPage()).toBe(1);
    });

    it('cancels the previous lookup when navigating to another store', () => {
        const previous = http.expectOne(`${API_ENDPOINTS.USERS.VENDOR}/store-one`);
        params.next(convertToParamMap({ id: 'store-two' }));
        expect(previous.cancelled).toBe(true);
        http.expectOne(`${API_ENDPOINTS.USERS.VENDOR}/store-two`).flush({
            ...response, id: 'store-two', vendorProfile: { ...response.vendorProfile, businessName: 'Store two' },
        });
        fixture.detectChanges();
        catalogRequest('store-two').flush({ data: [], total: 0, page: 1, limit: 10, totalPages: 0 });
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector('h1').textContent.trim()).toBe('Store two');
    });

    it('cancels pending products and hides the previous store while navigating', () => {
        http.expectOne(`${API_ENDPOINTS.USERS.VENDOR}/store-one`).flush(response);
        fixture.detectChanges();
        const previous = catalogRequest();
        params.next(convertToParamMap({ id: 'store-two' }));
        fixture.detectChanges();
        expect(previous.cancelled).toBe(true);
        expect(fixture.nativeElement.querySelector('[data-store-profile]')).toBeNull();
        http.expectOne(`${API_ENDPOINTS.USERS.VENDOR}/store-two`).flush({ ...response, id: 'store-two' });
        fixture.detectChanges();
        catalogRequest('store-two').flush({ data: [], total: 0, page: 1, limit: 10, totalPages: 0 });
        fixture.detectChanges();
    });

    it('retries products independently while retaining the profile', () => {
        http.expectOne(`${API_ENDPOINTS.USERS.VENDOR}/store-one`).flush(response);
        fixture.detectChanges();
        catalogRequest().flush({}, { status: 503, statusText: 'Unavailable' });
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector('[data-store-profile]')).not.toBeNull();
        expect(fixture.nativeElement.querySelector('#productos [role="alert"]')).not.toBeNull();
        (fixture.nativeElement.querySelector('#productos button') as HTMLButtonElement).click();
        fixture.detectChanges();
        catalogRequest().flush({ data: [product], total: 1, page: 1, limit: 10, totalPages: 1 });
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector('#productos [role="alert"]')).toBeNull();
        expect(fixture.nativeElement.querySelector('h3').textContent.trim()).toBe('Chair');
    });

    it('returns to the last available page when products are removed', () => {
        loadStore(12);
        fixture.componentInstance.changeProductPage(2);
        fixture.detectChanges();
        catalogRequest('store-one', 2).flush({ data: [], total: 1, page: 2, limit: 10, totalPages: 1 });
        fixture.detectChanges();
        catalogRequest().flush({ data: [product], total: 1, page: 1, limit: 10, totalPages: 1 });
        fixture.detectChanges();
        expect(fixture.componentInstance.currentProductPage()).toBe(1);
        expect(fixture.nativeElement.querySelector('h3').textContent.trim()).toBe('Chair');
    });

    it('shows an empty catalog without pagination', () => {
        loadStore(0);
        expect(fixture.nativeElement.querySelector('app-product-card')).toBeNull();
        expect(fixture.nativeElement.querySelector('app-pagination')).toBeNull();
        expect(fixture.nativeElement.querySelector('#productos').textContent).toContain('No hay productos disponibles');
    });

    it('provides a retry after a temporary profile failure', () => {
        http.expectOne(`${API_ENDPOINTS.USERS.VENDOR}/store-one`).flush({}, { status: 503, statusText: 'Unavailable' });
        fixture.detectChanges();
        (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();
        loadStore();
        expect(fixture.nativeElement.querySelector('[data-store-profile]')).not.toBeNull();
    });

    it.each([400, 404])('shows unavailable profiles without a retry or catalog request (%s)', status => {
        http.expectOne(`${API_ENDPOINTS.USERS.VENDOR}/store-one`).flush({}, { status, statusText: 'Unavailable' });
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();
        expect(fixture.nativeElement.querySelector('button')).toBeNull();
        http.expectNone(req => req.url === API_ENDPOINTS.PRODUCTS.BASE);
    });
});
