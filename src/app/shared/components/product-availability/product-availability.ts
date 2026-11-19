import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { resolveProductAvailability } from '@core/models/product/product-availability';
import type { ProductPreview } from '@core/models/product/product-summary';
import { MarketService } from '@core/services/market/market';
import { TranslatePipe } from '@core/services/i18n/translation-pipes';

const STATUS_LABELS = {
  madeToOrder: 'catalog.madeToOrder',
  inStock: 'catalog.inStock',
  outOfStock: 'catalog.outOfStock',
} as const;

@Component({
  selector: 'app-product-availability',
  imports: [TranslatePipe],
  templateUrl: './product-availability.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block', '[class.hidden]': '!visible()' },
})
export class ProductAvailability {
  private readonly market = inject(MarketService);
  readonly product = input.required<ProductPreview>();
  readonly compact = input(false);
  readonly customizable = input<boolean>();
  readonly availability = computed(() =>
    resolveProductAvailability(this.product(), this.market.selectedMarket().code),
  );
  readonly statusLabel = computed(() => {
    const { status } = this.availability();
    return status === 'unknown' || (status === 'inStock' && this.compact())
      ? null
      : STATUS_LABELS[status];
  });
  readonly showsCustomization = computed(
    () => !this.compact() && (this.customizable() ?? this.availability().acceptsCustomDimensions),
  );
  readonly visible = computed(
    () =>
      !!this.statusLabel() ||
      this.showsCustomization() ||
      (!this.compact() && !!this.availability().productionRange),
  );
}
