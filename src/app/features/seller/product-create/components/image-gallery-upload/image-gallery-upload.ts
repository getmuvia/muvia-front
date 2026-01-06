import { Component, input, output, signal, computed } from '@angular/core';
import { CreateProductAsset } from '@core/models/product/create-product.dto';

@Component({
    selector: 'app-image-gallery-upload',
    imports: [],
    templateUrl: './image-gallery-upload.html',
    styleUrl: './image-gallery-upload.css',
})
export class ImageGalleryUpload {
    assets = input<CreateProductAsset[]>([]);
    assetsChange = output<CreateProductAsset[]>();
    fileSelected = output<{ url: string; file: File }>();

    isDragging = signal(false);
    readonly maxImages = 5;

    primaryImage = computed(() => this.assets().find(a => a.isPrimary));
    secondaryImages = computed(() => this.assets().filter(a => !a.isPrimary));
    remainingSlots = computed(() => Math.max(0, this.maxImages - this.assets().length));
    emptySlots = computed(() => {
        const count = Math.min(this.remainingSlots(), 4 - this.secondaryImages().length);
        return count > 0 ? Array.from({ length: count }, (_, i) => i) : [];
    });

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
        input.value = '';
    }

    private handleFiles(files: FileList, isPrimary: boolean): void {
        const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
        const maxSize = 5 * 1024 * 1024;

        Array.from(files).forEach(file => {
            if (this.assets().length >= this.maxImages) return;
            if (!validTypes.includes(file.type) || file.size > maxSize) return;

            const url = URL.createObjectURL(file);
            let updated = [...this.assets()];
            if (isPrimary) {
                updated = updated.map(a => ({ ...a, isPrimary: false }));
            }

            updated.push({
                url,
                type: 'image',
                isPrimary: isPrimary && !this.primaryImage(),
                metadata: { alt: file.name.replace(/\.[^/.]+$/, '') }
            });
            this.fileSelected.emit({ url, file });
            this.assetsChange.emit(updated);
        });
    }

    removeImage(url: string): void {
        this.assetsChange.emit(this.assets().filter(a => a.url !== url));
    }

    setPrimary(url: string): void {
        this.assetsChange.emit(this.assets().map(a => ({ ...a, isPrimary: a.url === url })));
    }
}
