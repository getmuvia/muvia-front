import {
  disabled,
  max,
  min,
  required,
  validate,
  type SchemaPathTree,
} from '@angular/forms/signals';
import {
  ProductAvailabilityMode,
  MAX_PRODUCT_LEAD_TIME_DAYS,
  isProductAvailabilityMode,
  isProductionDayCount,
} from '@core/models/product/product-availability';
import type { ProductFormData } from '@core/models/product/product-form.model';

const PRODUCTION_RANGE_MESSAGE =
  'Indica días enteros positivos y un máximo igual o mayor que el mínimo.';

export function configureAvailability(path: SchemaPathTree<ProductFormData>): void {
  required(path.stock, { message: 'El stock es requerido' });
  min(path.stock, 0, { message: 'El stock no puede ser negativo' });
  disabled(path.stock, {
    when: ({ valueOf }) => valueOf(path.availabilityMode) === ProductAvailabilityMode.MADE_TO_ORDER,
  });
  validate(path.stock, ({ value }) =>
    Number.isInteger(value())
      ? null
      : { kind: 'integer', message: 'El stock debe ser un número entero.' },
  );
  validate(path.availabilityMode, ({ value }) =>
    isProductAvailabilityMode(value())
      ? null
      : { kind: 'availability', message: 'Selecciona una modalidad de disponibilidad válida.' },
  );
  for (const field of [path.leadTimeMinDays, path.leadTimeMaxDays]) {
    disabled(field, {
      when: ({ valueOf }) =>
        valueOf(path.availabilityMode) !== ProductAvailabilityMode.MADE_TO_ORDER,
    });
    min(field, 1, { message: PRODUCTION_RANGE_MESSAGE });
    max(field, MAX_PRODUCT_LEAD_TIME_DAYS, { message: PRODUCTION_RANGE_MESSAGE });
    validate(field, ({ value }) =>
      isProductionDayCount(value())
        ? null
        : { kind: 'productionDays', message: PRODUCTION_RANGE_MESSAGE },
    );
  }
  validate(path.leadTimeMaxDays, ({ value, valueOf }) =>
    value() >= valueOf(path.leadTimeMinDays)
      ? null
      : { kind: 'productionRange', message: PRODUCTION_RANGE_MESSAGE },
  );
}

export function isAvailabilityComplete(form: ProductFormData): boolean {
  if (!isProductAvailabilityMode(form.availabilityMode)) return false;
  if (form.availabilityMode === ProductAvailabilityMode.IN_STOCK)
    return Number.isInteger(form.stock) && form.stock >= 0;
  return (
    isProductionDayCount(form.leadTimeMinDays) &&
    isProductionDayCount(form.leadTimeMaxDays) &&
    form.leadTimeMinDays <= form.leadTimeMaxDays
  );
}
