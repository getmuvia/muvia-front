import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CreateProductAsset } from '@core/models/product/create-product.dto';

@Component({
    selector: 'app-image-gallery-upload',
    imports: [],
    templateUrl: './image-gallery-upload.html',
    styleUrl: './image-gallery-upload.css',
})
export class ImageGalleryUpload {
    @Input() assets: CreateProductAsset[] = [];
    @Output() assetsChange = new EventEmitter<CreateProductAsset[]>();

    isDragging = signal(false);
    maxImages = 5;

    get primaryImage(): CreateProductAsset | undefined {
        return this.assets.find(a => a.isPrimary);
    }

    get secondaryImages(): CreateProductAsset[] {
        return this.assets.filter(a => !a.isPrimary);
    }

    get remainingSlots(): number {
        return Math.max(0, this.maxImages - this.assets.length);
    }

    /** Returns an array of empty slot indices for the template */
    get emptySlots(): number[] {
        const count = Math.min(this.remainingSlots, 4 - this.secondaryImages.length);
        return count > 0 ? Array.from({ length: count }, (_, i) => i) : [];
    }

    onDragOver(event: DragEvent): void {
        event.preventDefault();
        this.isDragging.set(true);
    }

    onDragLeave(): void {
        this.isDragging.set(false);
    }

    onDrop(event: DragEvent, isPrimary: boolean): void {
        event.preventDefault();
        this.isDragging.set(false);

        const files = event.dataTransfer?.files;
        if (files && files.length > 0) {
            this.handleFiles(files, isPrimary);
        }
    }

    onFileSelect(event: Event, isPrimary: boolean): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            this.handleFiles(input.files, isPrimary);
        }
        // Reset input to allow selecting same file again
        input.value = '';
    }

    private handleFiles(files: FileList, isPrimary: boolean): void {
        const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
        const maxSize = 5 * 1024 * 1024; // 5MB

        Array.from(files).forEach(file => {
            if (this.assets.length >= this.maxImages) return;
            if (!validTypes.includes(file.type)) {
                console.warn('Invalid file type:', file.type);
                return;
            }
            if (file.size > maxSize) {
                console.warn('File too large:', file.size);
                return;
            }

            // Create a temporary URL for preview (in real implementation, upload to server)
            const url = URL.createObjectURL(file);

            // If setting as primary, remove primary flag from others
            let updatedAssets = [...this.assets];
            if (isPrimary) {
                updatedAssets = updatedAssets.map(a => ({ ...a, isPrimary: false }));
            }

            const newAsset: CreateProductAsset = {
                url,
                type: 'image',
                isPrimary: isPrimary && !this.primaryImage,
                metadata: {
                    alt: file.name.replace(/\.[^/.]+$/, ''),
                }
            };

            updatedAssets.push(newAsset);
            this.assetsChange.emit(updatedAssets);
        });
    }

    removeImage(url: string): void {
        const updated = this.assets.filter(a => a.url !== url);
        this.assetsChange.emit(updated);
    }

    setPrimary(url: string): void {
        const updated = this.assets.map(a => ({
            ...a,
            isPrimary: a.url === url
        }));
        this.assetsChange.emit(updated);
    }
}
