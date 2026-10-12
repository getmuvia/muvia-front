import { TranslatePipe, UiTextPipe, CategoryNamePipe } from '@core/services/i18n/translation-pipes';
import { Component, computed, inject, input, signal } from '@angular/core';
import { Product } from '@core/models/product/product';
import { PRODUCT_CONDITION_LABELS } from '@core/models/product/product-condition';
import { resolveProductPrice } from '@core/models/product/product-price';
import { MarketService } from '@core/services/market/market';
import { ProductPrice } from '@shared/components/product-price/product-price';
import { RouterLink } from '@angular/router';
import { I18nService } from '@core/services/i18n/i18n';

@Component({
    selector: 'app-product-info',
    imports: [CategoryNamePipe, TranslatePipe, UiTextPipe, ProductPrice, RouterLink],
    templateUrl: './product-info.html',
    styleUrl: './product-info.css',
})
export class ProductInfo {
    private readonly market = inject(MarketService);
    private readonly i18n = inject(I18nService);
    readonly product = input.required<Product>();
    readonly conditionLabel = computed(() => PRODUCT_CONDITION_LABELS[this.product().condition]);
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
        const subject = encodeURIComponent(this.i18n.t('catalog.contactSubject', {title: this.product().title}));
        const body = encodeURIComponent(
            this.i18n.t('catalog.contactBody', {title: this.product().title, id: this.product().id})
        );
        return `mailto:paul@getmuvia.com?subject=${subject}&body=${body}`;
    }

    async shareProduct(): Promise<void> {
        if (typeof navigator === 'undefined') return;

        const shareData = {
            title: `${this.product().title} · Muvia`,
            text: this.i18n.t('catalog.shareText', {title: this.product().title}),
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
