import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { VirtualStagingService } from '@core/services/virtual-staging/virtual-staging';
import { VirtualStagingResponse, StagingProduct } from '@core/models/ai/virtual-staging.models';
import { ProductCard } from '@shared/components/product-card/product-card';
import { Product } from '@core/models/product/product';

@Component({
    selector: 'app-result',
    imports: [CommonModule, ProductCard],
    templateUrl: './result.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './result.css'
})
export class Result implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly stagingService = inject(VirtualStagingService);

    result = signal<VirtualStagingResponse | null>(null);
    originalImageUrl = this.stagingService.originalImageUrl;
    isLoading = signal(true);
    sliderPosition = signal(50);

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

    mapToProduct(stagingProduct: StagingProduct): Product {
        return {
            id: stagingProduct.id,
            title: stagingProduct.title,
            price: stagingProduct.price.toString(),
            description: stagingProduct.description,
            assets: [{
                id: '1',
                url: stagingProduct.imageUrl,
                isPrimary: true,
                type: 'image',
                productId: stagingProduct.id,
                metadata: { alt: stagingProduct.title }
            }],
            category: {
                name: 'Sugerencia AI',
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
        } as Product;
    }

    async downloadImage(): Promise<void> {
        const imageUrl = this.result()?.stagedImageUrl;
        if (!imageUrl) return;

        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();

            const url = window.URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `iter-ai-staging-${new Date().getTime()}.png`;
            document.body.appendChild(a);

            a.click();

            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Error downloading image:', error);
            window.open(imageUrl, '_blank');
        }
    }
}
