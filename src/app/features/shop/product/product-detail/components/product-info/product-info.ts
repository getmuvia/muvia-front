import { TranslatePipe, CategoryNamePipe } from '@core/services/i18n/translation-pipes';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  linkedSignal,
  output,
} from '@angular/core';
import type { Product } from '@core/models/product/product';
import { PRODUCT_CONDITION_LABELS } from '@core/models/product/product-condition';
import { resolveProductPrice } from '@core/models/product/product-price';
import { MarketService } from '@core/services/market/market';
import { ProductPrice } from '@shared/components/product-price/product-price';
import { RouterLink } from '@angular/router';
import { I18nService, type TranslationKey } from '@core/services/i18n/i18n';
import { quotationDimensions } from '@core/models/quotation/quotation-dimensions';
import {
  formatPublishedDimensions,
  normalizePublishedDimensions,
} from '../../utils/published-dimensions';

@Component({
  selector: 'app-product-info',
  imports: [CategoryNamePipe, TranslatePipe, ProductPrice, RouterLink],
  templateUrl: './product-info.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block min-w-0' },
})
export class ProductInfo {
  private readonly market = inject(MarketService);
  private readonly i18n = inject(I18nService);
  readonly product = input.required<Product>();
  readonly customize = output<void>();
  readonly canCustomize = computed(
    () =>
      this.product().acceptsCustomDimensions &&
      !!quotationDimensions(this.product().specifications?.dimensions),
  );
  readonly conditionLabel = computed(() => PRODUCT_CONDITION_LABELS[this.product().condition]);
  readonly shareFeedback = linkedSignal<string, TranslationKey | null>({
    source: () => this.product().id,
    computation: () => null,
  });
  readonly dimensions = computed(() =>
    normalizePublishedDimensions(this.product().specifications?.dimensions),
  );
  readonly dimensionsLabel = computed(() => {
    const dimensions = this.dimensions();
    return dimensions ? formatPublishedDimensions(dimensions, this.market.locale()) : null;
  });
  readonly canVisualizeProduct = computed(
    () =>
      this.product().assets?.some(
        (asset) =>
          asset.type === 'image' &&
          (asset.url.startsWith('https://') || asset.url.startsWith('http://')),
      ) ?? false,
  );

  readonly price = computed(() =>
    resolveProductPrice(this.product(), this.market.selectedMarket().code),
  );

  readonly contactHref = computed(() => {
    const subject = encodeURIComponent(
      this.i18n.t('catalog.contactSubject', { title: this.product().title }),
    );
    const body = encodeURIComponent(
      this.i18n.t('catalog.contactBody', { title: this.product().title, id: this.product().id }),
    );
    return `mailto:paul@getmuvia.com?subject=${subject}&body=${body}`;
  });

  async shareProduct(): Promise<void> {
    if (typeof navigator === 'undefined') return;

    const shareData = {
      title: `${this.product().title} · Muvia`,
      text: this.i18n.t('catalog.shareText', { title: this.product().title }),
      url: `https://app.getmuvia.com/products/${this.product().id}`,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        this.shareFeedback.set('catalog.productShared');
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareData.url);
        this.shareFeedback.set('catalog.productLinkCopied');
      } else {
        this.shareFeedback.set('catalog.productShareUnavailable');
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      this.shareFeedback.set('catalog.productShareFailed');
    }
  }
}
