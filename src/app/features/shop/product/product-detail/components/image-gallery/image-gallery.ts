import { Component, input, signal, computed, CUSTOM_ELEMENTS_SCHEMA, inject, PLATFORM_ID, ChangeDetectionStrategy, ElementRef, HostListener, viewChild, OnDestroy } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { ProductAsset, ProductDimensions } from '@core/models/product/product';

@Component({
    selector: 'app-image-gallery',
    imports: [],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    templateUrl: './image-gallery.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    styleUrl: './image-gallery.css',
})
export class ImageGallery implements OnDestroy {
    private readonly platformId = inject(PLATFORM_ID);
    private readonly document = inject(DOCUMENT);
    private modelViewerImport: Promise<unknown> | null = null;
    private dimensionFrame: number | null = null;
    private lastDimensionRenderAt = 0;

    readonly assets = input<ProductAsset[]>([]);
    readonly dimensions = input<ProductDimensions | null>(null);
    readonly modelViewer = viewChild<ElementRef<ModelViewerElement>>('modelViewer');
    readonly dimensionLines = viewChild<ElementRef<SVGSVGElement>>('dimensionLines');

    selectedIndex = signal<number>(0);
    showModel3dViewer = signal<boolean>(false);
    modelViewerLoaded = signal<boolean>(false);
    isArPresenting = signal<boolean>(false);
    showDimensions = signal<boolean>(false);

    imageAssets = computed(() =>
        this.assets().filter(a => a.type === 'image')
    );

    glbAsset = computed(() =>
        this.assets().find(a =>
            a.type === 'model_3d' &&
            (a.metadata?.['format'] === 'glb' || a.metadata?.['format'] === 'gltf')
        )
    );

    usdzAsset = computed(() =>
        this.assets().find(a =>
            a.type === 'model_3d' && a.metadata?.['format'] === 'usdz'
        )
    );

    hasModel3d = computed(() => !!this.glbAsset());

    hasProductDimensions = computed(() => {
        const dimensions = this.dimensions();
        return !!dimensions
            && [dimensions.width, dimensions.height, dimensions.depth]
                .every(value => Number.isFinite(Number(value)) && Number(value) > 0);
    });

    get selectedAsset(): ProductAsset | null {
        const images = this.imageAssets();
        return images.length > 0 ? images[this.selectedIndex()] : null;
    }

    get hasMultipleImages(): boolean {
        return this.imageAssets().length > 1;
    }

    selectImage(index: number): void {
        this.selectedIndex.set(index);
    }

    openModel3dViewer(): void {
        if (this.hasModel3d()) {
            this.showDimensions.set(false);
            this.showModel3dViewer.set(true);
            void this.loadModelViewer();
        }
    }

    async activateAr(): Promise<void> {
        if (!this.hasModel3d() || !isPlatformBrowser(this.platformId)) return;

        this.showModel3dViewer.set(true);
        await this.loadModelViewer();
        await nextAnimationFrame();
        await this.modelViewer()?.nativeElement.activateAR?.();
    }

    closeModel3dViewer(): void {
        this.showModel3dViewer.set(false);
        this.isArPresenting.set(false);
        this.showDimensions.set(false);
        this.stopDimensionTracking();
    }

    onModelLoaded(): void {
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

    @HostListener('window:resize')
    onWindowResize(): void {
        this.startDimensionTracking();
    }

    @HostListener('document:visibilitychange')
    onDocumentVisibilityChange(): void {
        if (this.document.hidden) {
            this.stopDimensionTracking();
        } else {
            this.startDimensionTracking();
        }
    }

    ngOnDestroy(): void {
        this.stopDimensionTracking();
    }

    formatDimension(value: number): string {
        const unit = this.dimensions()?.unit ?? '';
        return `${DIMENSION_NUMBER_FORMAT.format(Number(value))} ${unit}`.trim();
    }

    private loadModelViewer(): Promise<unknown> {
        if (!isPlatformBrowser(this.platformId)) return Promise.resolve();

        this.modelViewerImport ??= import('@google/model-viewer').then(module => {
            this.modelViewerLoaded.set(true);
            return module;
        });

        return this.modelViewerImport;
    }

    private positionDimensionHotspots(): void {
        const viewer = this.modelViewer()?.nativeElement;
        const modelSize = viewer?.getDimensions?.();
        const center = viewer?.getBoundingBoxCenter?.();
        const productSize = this.dimensions();
        if (!viewer?.updateHotspot || !modelSize || !center || !productSize) return;

        const xIsLonger = modelSize.x >= modelSize.z;
        const declaredWidthIsLonger = productSize.width >= productSize.depth;
        const widthAxis: 'x' | 'z' = xIsLonger === declaredWidthIsLonger ? 'x' : 'z';
        const halfWidth = (widthAxis === 'x' ? modelSize.x : modelSize.z) / 2;
        const halfHeight = modelSize.y / 2;
        const halfDepth = (widthAxis === 'x' ? modelSize.z : modelSize.x) / 2;

        const point = (width: number, height: number, depth: number): Vector3 => ({
            x: center.x + (widthAxis === 'x' ? width : depth),
            y: center.y + height,
            z: center.z + (widthAxis === 'z' ? width : depth),
        });

        const positions: Record<string, Vector3> = {
            'hotspot-width-start': point(halfWidth, halfHeight, -halfDepth),
            'hotspot-width-end': point(-halfWidth, halfHeight, -halfDepth),
            'hotspot-width-label': point(0, halfHeight * 1.16, -halfDepth * 1.08),
            'hotspot-height-start': point(halfWidth, -halfHeight, -halfDepth),
            'hotspot-height-end': point(halfWidth, halfHeight, -halfDepth),
            'hotspot-height-label': point(halfWidth * 1.16, 0, -halfDepth * 1.08),
            'hotspot-depth-start': point(halfWidth, -halfHeight, halfDepth),
            'hotspot-depth-end': point(halfWidth, -halfHeight, -halfDepth),
            'hotspot-depth-label': point(halfWidth * 1.16, -halfHeight * 1.12, 0),
        };

        for (const [name, position] of Object.entries(positions)) {
            viewer.updateHotspot({ name, position: vectorToString(position) });
        }
    }

    private startDimensionTracking(): void {
        if (!this.hasProductDimensions()
            || !this.showModel3dViewer()
            || !this.showDimensions()
            || this.isArPresenting()
            || !isPlatformBrowser(this.platformId)
            || this.document.hidden
            || this.dimensionFrame !== null) {
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
        return isPlatformBrowser(this.platformId)
            && this.hasProductDimensions()
            && this.showModel3dViewer()
            && this.showDimensions()
            && !this.isArPresenting()
            && !this.document.hidden;
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

interface ModelViewerElement extends HTMLElement {
    activateAR?: () => Promise<void> | void;
    getDimensions?: () => Vector3;
    getBoundingBoxCenter?: () => Vector3;
    updateHotspot?: (hotspot: { name: string; position: string }) => void;
    queryHotspot?: (name: string) => { canvasPosition: Vector3 } | null;
}

interface Vector3 {
    x: number;
    y: number;
    z: number;
}

function nextAnimationFrame(): Promise<void> {
    return new Promise(resolve => requestAnimationFrame(() => resolve()));
}

function vectorToString(vector: Vector3): string {
    return `${vector.x} ${vector.y} ${vector.z}`;
}

const DIMENSION_NUMBER_FORMAT = new Intl.NumberFormat('es-BO', {
    maximumFractionDigits: 2,
});

const DIMENSION_RENDER_INTERVAL_MS = 1000 / 30;
