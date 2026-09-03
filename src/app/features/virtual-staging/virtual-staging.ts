import {
    ChangeDetectionStrategy,
    Component,
    DestroyRef,
    OnDestroy,
    OnInit,
    computed,
    inject,
    signal,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { VirtualStagingService } from '@core/services/virtual-staging/virtual-staging';
import { LoggerService } from '@core/services/logger/logger';
import { ProductService } from '@core/services/product/product';
import { Product } from '@core/models/product/product';
import { debounceTime, distinctUntilChanged, firstValueFrom, Subject } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

const PRODUCT_PAGE_SIZE = 12;

@Component({
    selector: 'app-virtual-staging',
    imports: [],
    templateUrl: './virtual-staging.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    styleUrl: './virtual-staging.css'
})
export class VirtualStaging implements OnInit, OnDestroy {
    private readonly stagingService = inject(VirtualStagingService);
    private readonly productService = inject(ProductService);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);
    private readonly logger = inject(LoggerService);
    private readonly destroyRef = inject(DestroyRef);
    private readonly searchRequests = new Subject<string>();
    private catalogRequestId = 0;

    isGenerating = signal(false);
    isQuotaLoading = signal(true);
    isCatalogLoading = signal(true);
    isLoadingMore = signal(false);
    dragActive = signal(false);
    errorMessage = signal<string | null>(null);
    catalogErrorMessage = signal<string | null>(null);
    selectionMessage = signal<string | null>(null);
    products = signal<Product[]>([]);
    selectedFile = signal<File | null>(null);
    selectedProductId = signal<string | null>(null);
    selectedProductDetails = signal<Product | null>(null);
    previewUrl = signal<string | null>(null);
    searchQuery = signal('');
    catalogPage = signal(1);
    catalogTotal = signal(0);
    catalogTotalPages = signal(0);
    readonly quota = this.stagingService.quota;
    readonly hasMoreProducts = computed(() => this.catalogPage() < this.catalogTotalPages());
    readonly canGenerate = computed(() => {
        const quota = this.quota();
        return !!this.selectedFile()
            && !!this.selectedProductId()
            && !!quota
            && quota.remaining > 0
            && !this.isGenerating();
    });

    constructor() {
        this.searchRequests.pipe(
            debounceTime(300),
            distinctUntilChanged(),
            takeUntilDestroyed(this.destroyRef),
        ).subscribe(() => {
            void this.loadProducts(1, false);
        });
    }

    async ngOnInit(): Promise<void> {
        const requestedProductId = this.route.snapshot.queryParamMap.get('productId');
        const tasks: Promise<void>[] = [this.loadQuota(), this.loadProducts(1, false)];

        if (requestedProductId) {
            tasks.push(this.loadSelectedProduct(requestedProductId));
        }

        await Promise.all(tasks);
    }

    ngOnDestroy(): void {
        this.revokePreviewUrl();
    }

    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];

        if (file) {
            this.selectFile(file);
        }

        input.value = '';
    }

    onDragOver(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();

        if (!this.isGenerating() && this.quota()?.remaining !== 0) {
            this.dragActive.set(true);
        }
    }

    onDragLeave(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.dragActive.set(false);
    }

    onDrop(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.dragActive.set(false);

        const file = event.dataTransfer?.files?.[0];
        if (file) {
            this.selectFile(file);
        }
    }

    selectProduct(product: Product): void {
        if (!this.isGenerating()) {
            this.selectedProductId.set(product.id);
            this.selectedProductDetails.set(product);
            this.selectionMessage.set(null);
            this.errorMessage.set(null);
            void this.updateSelectedProductQueryParam(product.id);
        }
    }

    changeProduct(): void {
        if (this.isGenerating()) return;

        this.selectedProductId.set(null);
        this.selectedProductDetails.set(null);
        this.selectionMessage.set(null);
        void this.updateSelectedProductQueryParam(null);
    }

    onSearchInput(event: Event): void {
        const query = (event.target as HTMLInputElement).value;
        const previousQuery = this.searchQuery().trim();
        this.searchQuery.set(query);

        const normalizedQuery = query.trim();
        if (normalizedQuery === previousQuery) return;

        this.prepareCatalogSearch(normalizedQuery);
    }

    clearSearch(): void {
        if (!this.searchQuery()) return;

        this.searchQuery.set('');
        this.prepareCatalogSearch('');
    }

    async loadMoreProducts(): Promise<void> {
        if (this.isCatalogLoading() || this.isLoadingMore() || !this.hasMoreProducts()) return;

        await this.loadProducts(this.catalogPage() + 1, true);
    }

    productImage(product: Product): string | null {
        const imageAssets = (product.assets ?? []).filter(asset =>
            asset.type === 'image'
            && (asset.url.startsWith('https://') || asset.url.startsWith('http://'))
        );
        return imageAssets.find(asset => asset.isPrimary)?.url ?? imageAssets[0]?.url ?? null;
    }

    async generateImage(): Promise<void> {
        const file = this.selectedFile();
        const productId = this.selectedProductId();

        if (!file || !productId || !this.canGenerate()) {
            this.errorMessage.set('Selecciona una fotografía y un producto antes de generar la imagen.');
            return;
        }

        this.errorMessage.set(null);
        this.isGenerating.set(true);

        try {
            await firstValueFrom(this.stagingService.generateStagedRoom(file, productId));
            this.logger.info('Staged room generated successfully', undefined, 'VirtualStaging');
            await this.router.navigate(['/virtual-staging/result']);
        } catch (error) {
            this.logger.error('Generation failed', error, 'VirtualStaging');
            this.errorMessage.set(this.getGenerationErrorMessage(error));
            await this.refreshQuota();
        } finally {
            this.isGenerating.set(false);
        }
    }

    private selectFile(file: File): void {
        if (this.isQuotaLoading() || this.quota()?.remaining === 0 || this.isGenerating()) {
            return;
        }

        if (!file.type.startsWith('image/')) {
            this.errorMessage.set('Selecciona un archivo de imagen válido.');
            return;
        }

        this.revokePreviewUrl();
        this.selectedFile.set(file);
        this.previewUrl.set(URL.createObjectURL(file));
        this.errorMessage.set(null);
    }

    private async loadQuota(): Promise<void> {
        try {
            await firstValueFrom(this.stagingService.getQuota());
        } catch (error) {
            this.logger.error('Could not load quota', error, 'VirtualStaging');
            this.errorMessage.set('No pudimos consultar tus generaciones disponibles. Inténtalo nuevamente.');
        } finally {
            this.isQuotaLoading.set(false);
        }
    }

    private async loadProducts(page: number, append: boolean): Promise<void> {
        const requestId = ++this.catalogRequestId;

        if (append) {
            this.isLoadingMore.set(true);
        } else {
            this.isCatalogLoading.set(true);
            this.catalogErrorMessage.set(null);
        }

        try {
            const response = await firstValueFrom(this.productService.searchProducts({
                search: this.searchQuery().trim(),
                page,
                limit: PRODUCT_PAGE_SIZE,
            }));

            if (requestId !== this.catalogRequestId) return;

            const productsWithImages = response.data.filter(product => !!this.productImage(product));
            const nextProducts = append
                ? this.mergeProducts(this.products(), productsWithImages)
                : productsWithImages;

            this.products.set(nextProducts);
            this.catalogPage.set(response.page);
            this.catalogTotal.set(response.total);
            this.catalogTotalPages.set(response.totalPages);
        } catch (error) {
            if (requestId !== this.catalogRequestId) return;

            this.logger.error('Could not load products', error, 'VirtualStaging');
            if (!append) {
                this.products.set([]);
                this.catalogErrorMessage.set('No pudimos cargar los productos. Inténtalo nuevamente.');
            } else {
                this.errorMessage.set('No pudimos cargar más productos. Inténtalo nuevamente.');
            }
        } finally {
            if (requestId === this.catalogRequestId) {
                this.isCatalogLoading.set(false);
                this.isLoadingMore.set(false);
            }
        }
    }

    private async loadSelectedProduct(productId: string): Promise<void> {
        try {
            const product = await firstValueFrom(this.productService.getProductById(productId));

            if (!this.productImage(product)) {
                this.selectionMessage.set('El producto seleccionado no tiene una imagen disponible. Elige otro producto.');
                await this.updateSelectedProductQueryParam(null);
                return;
            }

            this.selectedProductId.set(product.id);
            this.selectedProductDetails.set(product);
        } catch (error) {
            this.logger.warn('Could not preload selected product', error, 'VirtualStaging');
            this.selectionMessage.set('El producto del enlace ya no está disponible. Elige otro producto.');
            await this.updateSelectedProductQueryParam(null);
        }
    }

    private prepareCatalogSearch(query: string): void {
        this.catalogRequestId++;
        this.isCatalogLoading.set(true);
        this.isLoadingMore.set(false);
        this.catalogErrorMessage.set(null);
        this.searchRequests.next(query);
    }

    private updateSelectedProductQueryParam(productId: string | null): Promise<boolean> {
        return this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { productId },
            queryParamsHandling: 'merge',
            replaceUrl: true,
        });
    }

    private mergeProducts(currentProducts: Product[], newProducts: Product[]): Product[] {
        const productsById = new Map(currentProducts.map(product => [product.id, product]));
        newProducts.forEach(product => productsById.set(product.id, product));
        return Array.from(productsById.values());
    }

    private async refreshQuota(): Promise<void> {
        try {
            await firstValueFrom(this.stagingService.getQuota());
        } catch (error) {
            this.logger.error('Could not refresh quota', error, 'VirtualStaging');
        }
    }

    private getGenerationErrorMessage(error: unknown): string {
        if (error instanceof HttpErrorResponse && error.status === 429) {
            return 'Has alcanzado el límite de 10 generaciones de hoy. Inténtalo nuevamente mañana.';
        }

        if (error instanceof HttpErrorResponse && (error.status === 400 || error.status === 404)) {
            return 'El producto seleccionado ya no está disponible para generar esta visualización.';
        }

        return 'No pudimos generar la imagen. Inténtalo nuevamente.';
    }

    private revokePreviewUrl(): void {
        const currentUrl = this.previewUrl();
        if (currentUrl) {
            URL.revokeObjectURL(currentUrl);
        }
    }
}
