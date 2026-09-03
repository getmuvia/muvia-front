import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';
import { DecimalPipe, NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Product } from '@core/models/product/product';

@Component({
  selector: 'app-product-card',
  imports: [DecimalPipe, NgOptimizedImage, RouterLink],
  templateUrl: './product-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './product-card.css',
})
export class ProductCard {
  readonly product = input.required<Product>();
  readonly priority = input<boolean>(false);
  readonly showEditButton = input<boolean>(false);

  /** Get the primary image URL from assets */
  imageUrl = computed(() => {
    const assets = this.product().assets;
    const primary = assets?.find(a => a.isPrimary) || assets?.[0];
    return primary?.url || '';
  });

  /** Get alt text from primary asset metadata */
  altText = computed(() => {
    const assets = this.product().assets;
    const primary = assets?.find(a => a.isPrimary) || assets?.[0];
    return primary?.metadata?.alt || this.product().title;
  });

  /** Get price as number */
  priceNumber = computed(() => {
    return parseFloat(this.product().price) || 0;
  });
}
