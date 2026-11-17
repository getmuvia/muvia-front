import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { ProductDimensions } from '@core/models/product/product';
import { QUOTATION_AXES } from '@core/models/quotation/quotation';
import { TranslatePipe } from '@core/services/i18n/translation-pipes';

@Component({
  selector: 'app-dimension-comparison',
  imports: [TranslatePipe],
  templateUrl: './dimension-comparison.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DimensionComparison {
  readonly published = input.required<ProductDimensions>();
  readonly requested = input.required<ProductDimensions>();
  readonly axes = QUOTATION_AXES;
}
