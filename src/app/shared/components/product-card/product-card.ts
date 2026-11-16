import { TranslatePipe, CategoryNamePipe } from '@core/services/i18n/translation-pipes';
import { ChangeDetectionStrategy, Component, input, computed, signal, inject } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductPreview, productPreviewImage } from '@core/models/product/product-summary';
import { resolveProductPrice } from '@core/models/product/product-price';
import { MarketService } from '@core/services/market/market';
import { ProductPrice } from '../product-price/product-price';
import { ProductAvailability } from '../product-availability/product-availability';

@Component({
  selector: 'app-product-card',
  imports: [
    CategoryNamePipe,
    TranslatePipe,
    ProductPrice,
    ProductAvailability,
    NgOptimizedImage,
    RouterLink,
  ],
  templateUrl: './product-card.html',
  styleUrl: './product-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCard {
  private readonly market = inject(MarketService);
  readonly product = input.required<ProductPreview>();
  readonly priority = input<boolean>(false);
  readonly showEditButton = input<boolean>(false);

  private readonly imageAsset = computed(() => {
    return productPreviewImage(this.product());
  });
  private readonly failedImageUrl = signal<string | null>(null);

  readonly imageUrl = computed(() => this.imageAsset()?.url ?? '');
  readonly altText = computed(() => this.imageAsset()?.alt || this.product().title);
  readonly showImage = computed(
    () => !!this.imageUrl() && this.failedImageUrl() !== this.imageUrl(),
  );

  onImageError(): void {
    this.failedImageUrl.set(this.imageUrl());
  }

  readonly price = computed(() =>
    resolveProductPrice(this.product(), this.market.selectedMarket().code),
  );
}
