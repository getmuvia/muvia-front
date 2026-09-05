import { Component, input, computed, signal, ChangeDetectionStrategy } from '@angular/core';
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

  private readonly imageAsset = computed(() => {
    const images = this.product().assets?.filter(asset => asset.type === 'image' && asset.url);
    return images?.find(asset => asset.isPrimary) ?? images?.[0];
  });
  private readonly failedImageUrl = signal<string | null>(null);

  readonly imageUrl = computed(() => this.imageAsset()?.url ?? '');
  readonly altText = computed(() => this.imageAsset()?.metadata?.alt || this.product().title);
  readonly showImage = computed(() => !!this.imageUrl() && this.failedImageUrl() !== this.imageUrl());

  onImageError(): void {
    this.failedImageUrl.set(this.imageUrl());
  }

  /** Get price as number */
  priceNumber = computed(() => {
    return parseFloat(this.product().price) || 0;
  });
}
