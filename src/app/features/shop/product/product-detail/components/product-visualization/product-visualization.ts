import { DOCUMENT } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  linkedSignal,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import type { Product, ProductDimensions } from '@core/models/product/product';
import { TranslatePipe } from '@core/services/i18n/translation-pipes';
import { ProductModelViewer } from '../product-model-viewer/product-model-viewer';

type ViewerMode = '3d' | 'ar';

@Component({
  selector: 'app-product-visualization',
  imports: [RouterLink, TranslatePipe, ProductModelViewer],
  templateUrl: './product-visualization.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductVisualization {
  private readonly document = inject(DOCUMENT);
  private viewerTrigger: HTMLElement | null = null;

  readonly product = input.required<Product>();
  readonly dimensions = input<ProductDimensions | null>(null);
  readonly modelAsset = computed(() =>
    this.product().assets?.find(
      (asset) =>
        asset.type === 'model_3d' &&
        (asset.metadata?.['format'] === 'glb' || asset.metadata?.['format'] === 'gltf'),
    ),
  );
  readonly usdzAsset = computed(
    () =>
      this.product().assets?.find(
        (asset) => asset.type === 'model_3d' && asset.metadata?.['format'] === 'usdz',
      ) ?? null,
  );
  readonly canUseRoomPhoto = computed(() =>
    this.product().assets?.some(
      (asset) => asset.type === 'image' && /^https?:\/\//.test(asset.url),
    ),
  );
  readonly viewerRequest = linkedSignal<ViewerMode | null>(() => {
    // Starting with a different catalog model closes an open preview.
    this.modelAsset();
    return null;
  });
  readonly isIosDevice = signal(false);

  constructor() {
    afterNextRender(() =>
      this.isIosDevice.set(
        /iPad|iPhone|iPod/.test(navigator.userAgent) ||
          (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1),
      ),
    );
  }

  openViewer(mode: ViewerMode): void {
    if (!this.modelAsset()) return;
    this.viewerTrigger = this.document.activeElement as HTMLElement | null;
    this.viewerRequest.set(mode);
  }

  closeViewer(): void {
    this.viewerRequest.set(null);
    if (this.viewerTrigger?.isConnected) this.viewerTrigger.focus();
  }
}
