import { Component, input, signal, computed, CUSTOM_ELEMENTS_SCHEMA, inject, PLATFORM_ID, ChangeDetectionStrategy, ElementRef, viewChild } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ProductAsset } from '@core/models/product/product';

@Component({
    selector: 'app-image-gallery',
    imports: [],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    templateUrl: './image-gallery.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    styleUrl: './image-gallery.css',
})
export class ImageGallery {
    private readonly platformId = inject(PLATFORM_ID);
    private modelViewerImport: Promise<unknown> | null = null;

    readonly assets = input<ProductAsset[]>([]);
    readonly modelViewer = viewChild<ElementRef<ModelViewerElement>>('modelViewer');

    selectedIndex = signal<number>(0);
    showModel3dViewer = signal<boolean>(false);
    modelViewerLoaded = signal<boolean>(false);

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
    }

    private loadModelViewer(): Promise<unknown> {
        if (!isPlatformBrowser(this.platformId)) return Promise.resolve();

        this.modelViewerImport ??= import('@google/model-viewer').then(module => {
            this.modelViewerLoaded.set(true);
            return module;
        });

        return this.modelViewerImport;
    }
}

interface ModelViewerElement extends HTMLElement {
    activateAR?: () => Promise<void> | void;
}

function nextAnimationFrame(): Promise<void> {
    return new Promise(resolve => requestAnimationFrame(() => resolve()));
}
