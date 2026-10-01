import { Component, input, computed, signal } from '@angular/core';
import { DecimalPipe, NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductPreview, productPreviewImage } from '@core/models/product/product-summary';

@Component({
  selector: 'app-product-card',
  imports: [DecimalPipe, NgOptimizedImage, RouterLink],
  templateUrl: './product-card.html',
  styleUrl: './product-card.css',
})
export class ProductCard {
  readonly product = input.required<ProductPreview>();
  readonly priority = input<boolean>(false);
  readonly showEditButton = input<boolean>(false);
  readonly appearance = input<'default' | 'catalog'>('default');

  private readonly imageAsset = computed(() => {
    return productPreviewImage(this.product());
  });
  private readonly failedImageUrl = signal<string | null>(null);

  readonly imageUrl = computed(() => this.imageAsset()?.url ?? '');
  readonly altText = computed(() => this.imageAsset()?.alt || this.product().title);
  readonly showImage = computed(() => !!this.imageUrl() && this.failedImageUrl() !== this.imageUrl());

  onImageError(): void {
    this.failedImageUrl.set(this.imageUrl());
  }

  /** Get price as number */
  priceNumber = computed(() => {
    return Number(this.product().price) || 0;
  });
}
