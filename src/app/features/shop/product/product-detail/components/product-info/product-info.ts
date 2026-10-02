import { Component, computed, inject, input, signal } from '@angular/core';
import { Product } from '@core/models/product/product';
import { resolveProductPrice } from '@core/models/product/product-price';
import { MarketService } from '@core/services/market/market';
import { ProductPrice } from '@shared/components/product-price/product-price';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-product-info',
    imports: [ProductPrice, RouterLink],
    templateUrl: './product-info.html',
    styleUrl: './product-info.css',
})
export class ProductInfo {
    private readonly market = inject(MarketService);
    readonly product = input.required<Product>();
    readonly shareFeedback = signal('');
    readonly canVisualizeProduct = computed(() =>
        this.product().assets?.some(asset =>
            asset.type === 'image'
            && (asset.url.startsWith('https://') || asset.url.startsWith('http://'))
        ) ?? false
    );

    readonly price = computed(() =>
        resolveProductPrice(this.product(), this.market.selectedMarket().code)
    );

    get contactHref(): string {
        const subject = encodeURIComponent(`Consulta sobre ${this.product().title}`);
        const body = encodeURIComponent(
            `Hola Muvia, quiero solicitar información sobre el producto demo ${this.product().title} (ID: ${this.product().id}).`
        );
        return `mailto:paul@getmuvia.com?subject=${subject}&body=${body}`;
    }

    async shareProduct(): Promise<void> {
        if (typeof navigator === 'undefined') return;

        const shareData = {
            title: `${this.product().title} · Muvia`,
            text: `Mira ${this.product().title} en el catálogo demo de Muvia.`,
            url: `https://app.getmuvia.com/products/${this.product().id}`
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
                this.shareFeedback.set('Producto compartido.');
            } else if (navigator.clipboard) {
                await navigator.clipboard.writeText(shareData.url);
                this.shareFeedback.set('Enlace copiado.');
            } else {
                this.shareFeedback.set('Tu navegador no permite copiar el enlace automáticamente.');
            }
        } catch (error) {
            if (error instanceof DOMException && error.name === 'AbortError') return;
            this.shareFeedback.set('No se pudo compartir el enlace.');
        }
    }
}
