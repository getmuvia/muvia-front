import { Component, input, output, signal } from '@angular/core';
import { ProductAsset } from '@core/models/product/product';

@Component({
    selector: 'app-image-gallery',
    imports: [],
    templateUrl: './image-gallery.html',
    styleUrl: './image-gallery.css',
})
export class ImageGallery {
    assets = input<ProductAsset[]>([]);

    selectedIndex = signal<number>(0);

    get selectedAsset(): ProductAsset | null {
        const assetList = this.assets();
        return assetList.length > 0 ? assetList[this.selectedIndex()] : null;
    }

    selectImage(index: number): void {
        this.selectedIndex.set(index);
    }

    get hasMultipleImages(): boolean {
        return this.assets().length > 1;
    }
}
