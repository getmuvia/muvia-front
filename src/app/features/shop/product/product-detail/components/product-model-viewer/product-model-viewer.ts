import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  DestroyRef,
  ElementRef,
  inject,
  input,
  output,
  PLATFORM_ID,
  signal,
  viewChild,
  OnDestroy,
} from '@angular/core';
import type { ProductAsset, ProductDimensions } from '@core/models/product/product';
import { TranslatePipe } from '@core/services/i18n/translation-pipes';
import { LoggerService } from '@core/services/logger/logger';
import { MarketService } from '@core/services/market/market';
import { normalizePublishedDimensions } from '../../utils/published-dimensions';
import { modelDimensionHotspots, type ModelViewerElement } from './model-dimension-hotspots';

@Component({
  selector: 'app-product-model-viewer',
  imports: [TranslatePipe],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './product-model-viewer.html',
  styleUrl: './product-model-viewer.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(window:resize)': 'onWindowResize()',
    '(document:visibilitychange)': 'onDocumentVisibilityChange()',
  },
})
export class ProductModelViewer implements OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly logger = inject(LoggerService);
  private readonly market = inject(MarketService);
  private readonly dimensionNumberFormat = computed(
    () => new Intl.NumberFormat(this.market.locale(), { maximumFractionDigits: 6 }),
  );
  private modelViewerImport: Promise<unknown> | null = null;
  private dimensionFrame: number | null = null;
  private lastDimensionRenderAt = 0;

  readonly glbAsset = input.required<ProductAsset>();
  readonly usdzAsset = input<ProductAsset | null>(null);
  readonly dimensions = input<ProductDimensions | null>(null);
  readonly title = input.required<string>();
  readonly startInAr = input(false);
  readonly close = output<void>();
  readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  readonly modelViewer = viewChild<ElementRef<ModelViewerElement>>('modelViewer');
  readonly dimensionLines = viewChild<ElementRef<SVGSVGElement>>('dimensionLines');
  readonly modelViewerLoaded = signal(false);
  readonly viewerError = signal(false);
  readonly showDimensions = signal(false);
  readonly isArPresenting = signal(false);
  readonly hasProductDimensions = computed(
    () => normalizePublishedDimensions(this.dimensions()) !== null,
  );
  private arRequested = false;

  constructor() {
    afterNextRender(() => {
      this.dialog().nativeElement.showModal();
      void this.loadModelViewer();
    });
  }

  closeModel3dViewer(event?: Event): void {
    event?.preventDefault();
    this.stopDimensionTracking();
    this.dialog().nativeElement.close();
    this.close.emit();
  }

  retryViewer(): void {
    this.arRequested = false;
    void this.loadModelViewer();
  }

  onModelError(): void {
    this.viewerError.set(true);
    this.stopDimensionTracking();
  }

  async activateAr(): Promise<void> {
    try {
      await this.modelViewer()?.nativeElement.activateAR?.();
    } catch (error) {
      this.logger.error('Could not activate product AR', error, 'ProductModelViewer');
    }
  }

  onModelLoaded(): void {
    if (this.startInAr() && !this.arRequested) {
      this.arRequested = true;
      void this.activateAr();
    }
    if (!this.hasProductDimensions()) return;

    requestAnimationFrame(() => {
      this.positionDimensionHotspots();
      if (this.showDimensions()) {
        this.renderDimensionLines();
        this.startDimensionTracking();
      }
    });
  }

  toggleDimensions(): void {
    const shouldShow = !this.showDimensions();
    this.showDimensions.set(shouldShow);

    if (!shouldShow) {
      this.stopDimensionTracking();
      return;
    }

    requestAnimationFrame(() => {
      this.positionDimensionHotspots();
      this.renderDimensionLines();
      this.startDimensionTracking();
    });
  }

  onCameraChange(): void {
    this.startDimensionTracking();
  }

  onArStatus(event: Event): void {
    const status = (event as CustomEvent<{ status?: string }>).detail?.status;
    const isPresenting = status === 'session-started';
    this.isArPresenting.set(isPresenting);

    if (isPresenting) {
      this.stopDimensionTracking();
    } else {
      this.startDimensionTracking();
    }
  }

  onWindowResize(): void {
    this.startDimensionTracking();
  }

  onDocumentVisibilityChange(): void {
    if (this.document.hidden) {
      this.stopDimensionTracking();
    } else {
      this.startDimensionTracking();
    }
  }

  ngOnDestroy(): void {
    this.stopDimensionTracking();
    const dialog = this.dialog().nativeElement;
    if (dialog.open) dialog.close();
  }

  formatDimension(value: number): string {
    const unit = this.dimensions()?.unit ?? '';
    return `${this.dimensionNumberFormat().format(Number(value))} ${unit}`.trim();
  }

  private loadModelViewer(): Promise<unknown> {
    if (!isPlatformBrowser(this.platformId)) return Promise.resolve();

    this.viewerError.set(false);
    this.modelViewerImport ??= import('@google/model-viewer')
      .then((module) => {
        if (!this.destroyRef.destroyed) this.modelViewerLoaded.set(true);
        return module;
      })
      .catch((error) => {
        this.modelViewerImport = null;
        if (!this.destroyRef.destroyed) this.viewerError.set(true);
        this.logger.error('Could not load product model viewer', error, 'ProductModelViewer');
        return null;
      });

    return this.modelViewerImport;
  }

  private positionDimensionHotspots(): void {
    const viewer = this.modelViewer()?.nativeElement;
    const size = viewer?.getDimensions?.();
    const center = viewer?.getBoundingBoxCenter?.();
    const dimensions = this.dimensions();
    if (!viewer?.updateHotspot || !size || !center || !dimensions) return;
    for (const hotspot of modelDimensionHotspots(size, center, dimensions)) {
      viewer.updateHotspot(hotspot);
    }
  }

  private startDimensionTracking(): void {
    if (
      !this.hasProductDimensions() ||
      !this.showDimensions() ||
      this.isArPresenting() ||
      !isPlatformBrowser(this.platformId) ||
      this.document.hidden ||
      this.dimensionFrame !== null
    ) {
      return;
    }

    const updateLines = (timestamp: number): void => {
      if (!this.canTrackDimensionLines()) {
        this.dimensionFrame = null;
        return;
      }

      if (timestamp - this.lastDimensionRenderAt >= DIMENSION_RENDER_INTERVAL_MS) {
        this.renderDimensionLines();
        this.lastDimensionRenderAt = timestamp;
      }

      this.dimensionFrame = requestAnimationFrame(updateLines);
    };

    this.lastDimensionRenderAt = 0;
    this.dimensionFrame = requestAnimationFrame(updateLines);
  }

  private stopDimensionTracking(): void {
    if (this.dimensionFrame !== null && isPlatformBrowser(this.platformId)) {
      cancelAnimationFrame(this.dimensionFrame);
    }

    this.dimensionFrame = null;
    this.lastDimensionRenderAt = 0;
  }

  private canTrackDimensionLines(): boolean {
    return (
      isPlatformBrowser(this.platformId) &&
      this.hasProductDimensions() &&
      this.showDimensions() &&
      !this.isArPresenting() &&
      !this.document.hidden
    );
  }

  private renderDimensionLines(): void {
    const viewer = this.modelViewer()?.nativeElement;
    const svg = this.dimensionLines()?.nativeElement;
    if (!viewer?.queryHotspot || !svg || !this.showDimensions() || this.isArPresenting()) return;

    const lineDefinitions = [
      ['width', 'hotspot-width-start', 'hotspot-width-end'],
      ['height', 'hotspot-height-start', 'hotspot-height-end'],
      ['depth', 'hotspot-depth-start', 'hotspot-depth-end'],
    ] as const;

    for (const [lineName, startName, endName] of lineDefinitions) {
      const line = svg.querySelector<SVGLineElement>(`[data-dimension-line="${lineName}"]`);
      const start = viewer.queryHotspot(startName)?.canvasPosition;
      const end = viewer.queryHotspot(endName)?.canvasPosition;
      if (!line || !start || !end) continue;

      line.setAttribute('x1', `${start.x}`);
      line.setAttribute('y1', `${start.y}`);
      line.setAttribute('x2', `${end.x}`);
      line.setAttribute('y2', `${end.y}`);
    }
  }
}

const DIMENSION_RENDER_INTERVAL_MS = 1000 / 30;
