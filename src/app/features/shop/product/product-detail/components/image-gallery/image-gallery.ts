import { DOCUMENT, NgOptimizedImage, NgTemplateOutlet } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  linkedSignal,
  signal,
  viewChild,
} from '@angular/core';
import type { ProductAsset, ProductDimensions } from '@core/models/product/product';
import { TranslatePipe } from '@core/services/i18n/translation-pipes';
import { normalizePublishedDimensions } from '../../utils/published-dimensions';
import { PublishedDimensions } from '../published-dimensions/published-dimensions';
import { ProductModelViewer } from '../product-model-viewer/product-model-viewer';

type GalleryView = 'images' | 'dimensions';
type ViewerRequest = '3d' | 'ar' | null;

@Component({
  selector: 'app-image-gallery',
  imports: [
    TranslatePipe,
    NgOptimizedImage,
    NgTemplateOutlet,
    PublishedDimensions,
    ProductModelViewer,
  ],
  templateUrl: './image-gallery.html',
  styleUrl: './image-gallery.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageGallery {
  private readonly document = inject(DOCUMENT);
  private viewerTrigger: HTMLElement | null = null;
  private readonly imagesTab = viewChild<ElementRef<HTMLButtonElement>>('imagesTab');
  private readonly dimensionsTab = viewChild<ElementRef<HTMLButtonElement>>('dimensionsTab');

  readonly assets = input<ProductAsset[]>([]);
  readonly dimensions = input<ProductDimensions | null>(null);
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
  readonly publishedDimensions = computed(() => normalizePublishedDimensions(this.dimensions()));
  readonly activeView = linkedSignal<GalleryView>(() =>
    !this.imageAssets().length && this.publishedDimensions() ? 'dimensions' : 'images',
  );
  readonly glbAsset = computed(
    () =>
      this.assets().find(
        (asset) =>
          asset.type === 'model_3d' &&
          (asset.metadata?.['format'] === 'glb' || asset.metadata?.['format'] === 'gltf'),
      ) ?? null,
  );
  readonly usdzAsset = computed(
    () =>
      this.assets().find(
        (asset) => asset.type === 'model_3d' && asset.metadata?.['format'] === 'usdz',
      ) ?? null,
  );
  readonly viewerRequest = linkedSignal<ProductAsset[], ViewerRequest>({
    source: this.assets,
    computation: () => null,
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

  selectImage(index: number): void {
    if (!Number.isInteger(index) || !this.imageAssets()[index]) return;
    this.selectedIndex.set(index);
  }

  selectView(view: GalleryView): void {
    if (view === 'dimensions' && !this.publishedDimensions()) return;
    this.activeView.set(view);
  }

  showPublishedDimensions(): void {
    this.selectView('dimensions');
    this.dimensionsTab()?.nativeElement.focus();
  }

  onViewKeydown(event: KeyboardEvent): void {
    if (
      !this.publishedDimensions() ||
      !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)
    )
      return;
    event.preventDefault();
    const view =
      event.key === 'Home'
        ? 'images'
        : event.key === 'End'
          ? 'dimensions'
          : this.activeView() === 'images'
            ? 'dimensions'
            : 'images';
    this.selectView(view);
    (view === 'images' ? this.imagesTab() : this.dimensionsTab())?.nativeElement.focus();
  }

  openModel3dViewer(mode: Exclude<ViewerRequest, null> = '3d'): void {
    if (!this.glbAsset()) return;
    this.viewerTrigger = this.document.activeElement as HTMLElement | null;
    this.viewerRequest.set(mode);
  }

  closeModel3dViewer(): void {
    this.viewerRequest.set(null);
    if (this.viewerTrigger?.isConnected) this.viewerTrigger.focus();
  }
}
