import { TranslatePipe } from '@core/services/i18n/translation-pipes';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { ProductSummary } from '@core/models/product/product-summary';
import { ProductCard } from '@shared/components/product-card/product-card';

@Component({
  selector: 'app-similar-products',
  imports: [TranslatePipe, ProductCard, RouterLink],
  templateUrl: './similar-products.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block min-w-0' },
})
export class SimilarProducts {
  readonly products = input<ProductSummary[]>([]);
}
