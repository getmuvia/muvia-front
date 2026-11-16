import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import type { ProductDimensions } from '@core/models/product/product';
import { TranslatePipe } from '@core/services/i18n/translation-pipes';
import { MarketService } from '@core/services/market/market';
import { fitDimensionPlane } from './dimension-plane';

@Component({
  selector: 'app-published-dimensions',
  imports: [TranslatePipe],
  templateUrl: './published-dimensions.html',
  styleUrl: './published-dimensions.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublishedDimensions {
  private readonly market = inject(MarketService);
  readonly dimensions = input.required<ProductDimensions>();
  readonly showDiagram = input(false);
  private readonly formatter = computed(
    () =>
      new Intl.NumberFormat(this.market.locale(), {
        maximumFractionDigits: 6,
      }),
  );
  readonly labels = computed(() => {
    const dimensions = this.dimensions();
    const format = (value: number) => `${this.formatter().format(value)} ${dimensions.unit}`;
    return {
      width: format(dimensions.width),
      depth: format(dimensions.depth),
      height: format(dimensions.height),
    };
  });
  readonly measurements = computed(() => [
    { key: 'common.width' as const, value: this.labels().width },
    { key: 'catalog.depth' as const, value: this.labels().depth },
    { key: 'common.height' as const, value: this.labels().height },
  ]);
  readonly frontPlane = computed(() =>
    fitDimensionPlane(this.dimensions().width, this.dimensions().height),
  );
  readonly topPlane = computed(() =>
    fitDimensionPlane(this.dimensions().width, this.dimensions().depth),
  );
}
