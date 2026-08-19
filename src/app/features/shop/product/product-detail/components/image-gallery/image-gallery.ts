import { Component, input, signal, computed, CUSTOM_ELEMENTS_SCHEMA, inject, PLATFORM_ID, afterNextRender, ChangeDetectionStrategy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ProductAsset } from '@core/models/product/product';

@Component({
    selector: 'app-image-gallery',
    imports: [],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    templateUrl: './image-gallery.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './image-gallery.css',
})
export class ImageGallery {
    private platformId = inject(PLATFORM_ID);

    assets = input<ProductAsset[]>([]);

    selectedIndex = signal<number>(0);
    showModel3dViewer = signal<boolean>(false);
    modelViewerLoaded = signal<boolean>(false);

    constructor() {
        afterNextRender(() => {
            if (isPlatformBrowser(this.platformId)) {
                import('@google/model-viewer').then(() => {
                    this.modelViewerLoaded.set(true);
                });
            }
        });
    }

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
        }
    }

    activateAr(): void {
        // Open the modal first, then trigger AR
        if (this.hasModel3d()) {
            this.showModel3dViewer.set(true);
            // Wait for model-viewer to render, then activate AR
            setTimeout(() => {
                const modelViewer = document.querySelector('model-viewer') as any;
                if (modelViewer && modelViewer.activateAR) {
                    modelViewer.activateAR();
                }
            }, 500);
        }
    }

    closeModel3dViewer(): void {
        this.showModel3dViewer.set(false);
    }
}
