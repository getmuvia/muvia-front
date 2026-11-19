import { NgOptimizedImage, NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  linkedSignal,
  signal,
} from '@angular/core';
import type { ProductAsset } from '@core/models/product/product';
import { TranslatePipe } from '@core/services/i18n/translation-pipes';

@Component({
  selector: 'app-image-gallery',
  imports: [TranslatePipe, NgOptimizedImage, NgTemplateOutlet],
  templateUrl: './image-gallery.html',
  styleUrl: './image-gallery.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageGallery {
  private touchStart: { x: number; y: number } | null = null;

  readonly assets = input<ProductAsset[]>([]);
  readonly title = input('');
  readonly imageAssets = computed(() =>
    this.assets()
      .filter(
        (asset) => asset.type === 'image' && typeof asset.url === 'string' && asset.url.trim(),
      )
      .sort((first, second) => Number(second.isPrimary) - Number(first.isPrimary)),
  );
  readonly selectedIndex = linkedSignal({ source: this.imageAssets, computation: () => 0 });
  readonly selectedAsset = computed(() => this.imageAssets()[this.selectedIndex()] ?? null);
  readonly imageFailed = linkedSignal({ source: this.selectedAsset, computation: () => false });
  readonly hasMultipleImages = computed(() => this.imageAssets().length > 1);
  readonly viewerOpen = signal(false);

  selectImage(index: number): void {
    if (!Number.isInteger(index) || !this.imageAssets()[index]) return;
    this.selectedIndex.set(index);
  }

  stepImage(direction: -1 | 1): void {
    const count = this.imageAssets().length;
    if (count > 1) this.selectImage((this.selectedIndex() + direction + count) % count);
  }

  openViewer(dialog: HTMLDialogElement): void {
    if (!this.selectedAsset() || this.imageFailed() || dialog.open) return;
    dialog.showModal();
    this.viewerOpen.set(true);
  }

  onViewerKeydown(event: KeyboardEvent): void {
    if (!this.hasMultipleImages() || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) {
      return;
    }
    event.preventDefault();
    this.stepImage(event.key === 'ArrowLeft' ? -1 : 1);
  }

  startSwipe(event: TouchEvent): void {
    const touch = event.touches.length === 1 ? event.touches[0] : null;
    this.touchStart = touch ? { x: touch.clientX, y: touch.clientY } : null;
  }

  endSwipe(event: TouchEvent): void {
    const start = this.touchStart;
    this.cancelSwipe();
    const touch = event.changedTouches[0];
    if (!start || !touch || !this.hasMultipleImages()) return;

    const horizontal = touch.clientX - start.x;
    const vertical = touch.clientY - start.y;
    if (Math.abs(horizontal) < 40 || Math.abs(horizontal) <= Math.abs(vertical)) return;

    if (event.cancelable) event.preventDefault();
    this.stepImage(horizontal < 0 ? 1 : -1);
  }

  cancelSwipe(): void {
    this.touchStart = null;
  }
}
