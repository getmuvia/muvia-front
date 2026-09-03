import {
    ChangeDetectionStrategy,
    Component,
    OnDestroy,
    OnInit,
    computed,
    inject,
    signal,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { VirtualStagingService } from '@core/services/virtual-staging/virtual-staging';
import { LoggerService } from '@core/services/logger/logger';
import { ProductService } from '@core/services/product/product';
import { Product } from '@core/models/product/product';
import { firstValueFrom } from 'rxjs';

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
    private readonly logger = inject(LoggerService);

    isGenerating = signal(false);
    isQuotaLoading = signal(true);
    isCatalogLoading = signal(true);
    dragActive = signal(false);
    errorMessage = signal<string | null>(null);
    catalogErrorMessage = signal<string | null>(null);
    products = signal<Product[]>([]);
    selectedFile = signal<File | null>(null);
    selectedProductId = signal<string | null>(null);
    previewUrl = signal<string | null>(null);
    readonly quota = this.stagingService.quota;
    readonly canGenerate = computed(() => {
        const quota = this.quota();
        return !!this.selectedFile()
            && !!this.selectedProductId()
            && !!quota
            && quota.remaining > 0
            && !this.isGenerating();
    });

    async ngOnInit(): Promise<void> {
        await Promise.all([this.loadQuota(), this.loadProducts()]);
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

    selectProduct(productId: string): void {
        if (!this.isGenerating()) {
            this.selectedProductId.set(productId);
            this.errorMessage.set(null);
        }
    }

    productImage(product: Product): string | null {
        const imageAssets = (product.assets ?? []).filter(asset => asset.type === 'image' && !!asset.url);
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

    private async loadProducts(): Promise<void> {
        try {
            const response = await firstValueFrom(this.productService.searchProducts({
                search: '',
                page: 1,
                limit: 24,
            }));
            const productsWithImages = response.data.filter(product => !!this.productImage(product));
            this.products.set(productsWithImages);

            if (productsWithImages.length === 0) {
                this.catalogErrorMessage.set('No hay productos con imágenes disponibles para generar una visualización.');
            }
        } catch (error) {
            this.logger.error('Could not load products', error, 'VirtualStaging');
            this.catalogErrorMessage.set('No pudimos cargar los productos. Inténtalo nuevamente.');
        } finally {
            this.isCatalogLoading.set(false);
        }
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
