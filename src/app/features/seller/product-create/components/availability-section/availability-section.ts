import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormField, type FieldTree } from '@angular/forms/signals';
import { ProductAvailabilityMode } from '@core/models/product/product-availability';
import { TranslatePipe } from '@core/services/i18n/translation-pipes';

@Component({
  selector: 'app-availability-section',
  imports: [FormField, TranslatePipe],
  templateUrl: './availability-section.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvailabilitySection {
  readonly modeField = input.required<FieldTree<ProductAvailabilityMode>>();
  readonly stockField = input.required<FieldTree<number>>();
  readonly minDaysField = input.required<FieldTree<number>>();
  readonly maxDaysField = input.required<FieldTree<number>>();
  readonly customDimensionsField = input.required<FieldTree<boolean>>();
  readonly mode = ProductAvailabilityMode;

  invalid(field: FieldTree<unknown>): boolean {
    return field().touched() && field().invalid();
  }
}
