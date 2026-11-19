import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import type { ProductDimensions } from '@core/models/product/product';
import { QUOTATION_AXES } from '@core/models/quotation/quotation';
import { TranslatePipe } from '@core/services/i18n/translation-pipes';
import { MarketService } from '@core/services/market/market';

@Component({
  selector: 'app-published-dimensions',
  imports: [TranslatePipe],
  templateUrl: './published-dimensions.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class PublishedDimensions {
  private readonly market = inject(MarketService);
  readonly dimensions = input.required<ProductDimensions>();
  readonly measurements = computed(() => {
    const dimensions = this.dimensions();
    const formatter = new Intl.NumberFormat(this.market.locale(), { maximumFractionDigits: 6 });

    return QUOTATION_AXES.map(({ key, label }) => ({
      key,
      label,
      value: `${formatter.format(dimensions[key])} ${dimensions.unit}`,
    }));
  });
}
