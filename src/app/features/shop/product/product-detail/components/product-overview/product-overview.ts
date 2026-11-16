import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import type { Product } from '@core/models/product/product';
import { resolveProductListing, resolveProductPrice } from '@core/models/product/product-price';
import { TranslatePipe } from '@core/services/i18n/translation-pipes';
import { MarketService } from '@core/services/market/market';
import { ProductPrice } from '@shared/components/product-price/product-price';
import {
  formatPublishedDimensions,
  normalizePublishedDimensions,
} from '../../utils/published-dimensions';

@Component({
  selector: 'app-product-overview',
  imports: [TranslatePipe, ProductPrice],
  templateUrl: './product-overview.html',
  styleUrl: './product-overview.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductOverview {
  private readonly market = inject(MarketService);
  readonly product = input.required<Product>();
  readonly viewDimensions = output<void>();
  readonly price = computed(() =>
    resolveProductPrice(this.product(), this.market.selectedMarket().code),
  );
  readonly dimensionLabel = computed(() => {
    const dimensions = normalizePublishedDimensions(this.product().specifications?.dimensions);
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
    const listing = resolveProductListing(product, this.market.selectedMarket().code);
    const stock = listing?.stock ?? product.stock;
    return Number.isFinite(stock) && stock >= 0 ? stock : null;
  });
}
