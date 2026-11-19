import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { PRODUCT_CONDITION_LABELS } from '@core/models/product/product-condition';
import { ProductAvailabilityMode } from '@core/models/product/product-availability';
import type { Product } from '@core/models/product/product';
import { resolveProductListing, resolveProductPrice } from '@core/models/product/product-price';
import { I18nService } from '@core/services/i18n/i18n';
import { TranslatePipe } from '@core/services/i18n/translation-pipes';
import { MarketService } from '@core/services/market/market';
import { ProductPrice } from '@shared/components/product-price/product-price';
import { ProductAvailability } from '@shared/components/product-availability/product-availability';
import {
  formatPublishedDimensions,
  normalizePublishedDimensions,
} from '../../utils/published-dimensions';
import { ProductVisualization } from '../product-visualization/product-visualization';
import { PublishedDimensions } from '../published-dimensions/published-dimensions';

@Component({
  selector: 'app-product-overview',
  imports: [
    NgTemplateOutlet,
    TranslatePipe,
    ProductPrice,
    ProductAvailability,
    ProductVisualization,
    PublishedDimensions,
  ],
  templateUrl: './product-overview.html',
  styleUrl: './product-overview.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductOverview {
  private readonly market = inject(MarketService);
  private readonly i18n = inject(I18nService);

  readonly product = input.required<Product>();
  readonly canCustomize = input(false);
  readonly customize = output<void>();
  readonly share = output<void>();
  readonly price = computed(() =>
    resolveProductPrice(this.product(), this.market.selectedMarket().code),
  );
  readonly conditionLabel = computed(() => PRODUCT_CONDITION_LABELS[this.product().condition]);
  readonly dimensions = computed(() =>
    normalizePublishedDimensions(this.product().specifications?.dimensions),
  );
  readonly dimensionLabel = computed(() => {
    const dimensions = this.dimensions();
    return dimensions ? formatPublishedDimensions(dimensions, this.market.locale()) : null;
  });
  readonly description = computed(() => this.product().description?.trim() || null);
  readonly specifications = computed(() => {
    const specifications = this.product().specifications;
    return [
      { label: 'common.material' as const, value: specifications?.material },
      { label: 'common.color' as const, value: specifications?.color },
      { label: 'common.weight' as const, value: specifications?.weight },
    ].filter((item) => typeof item.value === 'string' && item.value.trim());
  });
  readonly stock = computed(() => {
    const product = this.product();
    if (product.availabilityMode === ProductAvailabilityMode.MADE_TO_ORDER) return null;

    const listing = resolveProductListing(product, this.market.selectedMarket().code);
    const stock = listing?.stock ?? product.stock;
    return Number.isFinite(stock) && stock >= 0 ? stock : null;
  });
  readonly contactHref = computed(() => {
    const { id, title } = this.product();
    const subject = encodeURIComponent(this.i18n.t('catalog.contactSubject', { title }));
    const body = encodeURIComponent(this.i18n.t('catalog.contactBody', { title, id }));
    return `mailto:paul@getmuvia.com?subject=${subject}&body=${body}`;
  });
}
