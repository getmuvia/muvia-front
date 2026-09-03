import { Component, computed, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { VirtualStagingService } from '@core/services/virtual-staging/virtual-staging';
import { VirtualStagingResponse, StagingProduct } from '@core/models/ai/virtual-staging.models';
import { ProductCard } from '@shared/components/product-card/product-card';
import { Product } from '@core/models/product/product';
import { LoggerService } from '@core/services/logger/logger';

@Component({
    selector: 'app-result',
    imports: [ProductCard],
    templateUrl: './result.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    styleUrl: './result.css'
})
export class Result implements OnInit {
    private readonly router = inject(Router);
    private readonly stagingService = inject(VirtualStagingService);
    private readonly logger = inject(LoggerService);

    result = signal<VirtualStagingResponse | null>(null);
    originalImageUrl = this.stagingService.originalImageUrl;
    isLoading = signal(true);
    sliderPosition = signal(50);
    readonly selectedProduct = computed(() => {
        const product = this.result()?.selectedProduct;
        return product ? this.mapToProduct(product) : null;
    });

    ngOnInit(): void {
        const result = this.stagingService.currentResult();

        if (!result) {
            this.router.navigate(['/virtual-staging']);
            return;
        }

        this.result.set(result);
        this.isLoading.set(false);
    }

    onSliderChange(event: Event): void {
        const input = event.target as HTMLInputElement;
        this.sliderPosition.set(Number(input.value));
    }

    private mapToProduct(stagingProduct: StagingProduct): Product {
        return {
            id: stagingProduct.id,
            title: stagingProduct.title,
            price: stagingProduct.price.toString(),
            description: stagingProduct.description ?? '',
            assets: [{
                id: '1',
                url: stagingProduct.imageUrl,
                isPrimary: true,
                type: 'image',
                productId: stagingProduct.id,
                metadata: { alt: stagingProduct.title }
            }],
            category: {
                name: 'Producto seleccionado',
                id: '0',
                imageUrl: '',
                description: '',
                level: 0,
                parentId: null
            },

            sellerId: '0',
            categoryId: '0',
            stock: 1,
            specifications: {},
            keywords: [],
            createdAt: new Date().toISOString()
        };
    }

    async downloadImage(): Promise<void> {
        const imageUrl = this.result()?.stagedImageUrl;
        if (!imageUrl) return;

        try {
            const response = await fetch(imageUrl);
            if (!response.ok) throw new Error(`Download failed with status ${response.status}`);
            const blob = await response.blob();

            const url = window.URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `muvia-staging-${new Date().getTime()}.png`;
            a.rel = 'noopener noreferrer';
            document.body.appendChild(a);

            a.click();

            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            this.logger.error('Error downloading image', error, 'VirtualStagingResult');
            window.open(imageUrl, '_blank', 'noopener,noreferrer');
        }
    }
}
