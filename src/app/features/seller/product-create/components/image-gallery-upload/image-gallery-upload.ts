import { Component, output, signal, computed, ChangeDetectionStrategy, model } from '@angular/core';
import { CreateProductAsset } from '@core/models/product/create-product.dto';

@Component({
    selector: 'app-image-gallery-upload',
    imports: [],
    templateUrl: './image-gallery-upload.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    styleUrl: './image-gallery-upload.css',
})
export class ImageGalleryUpload {
    readonly assets = model<CreateProductAsset[]>([]);
    readonly fileSelected = output<{ url: string; file: File }>();

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

        let updated = [...this.assets()];
        let assignPrimary = isPrimary || !updated.some(asset => asset.isPrimary);

        for (const file of Array.from(files)) {
            if (updated.length >= this.maxImages) break;
            if (!validTypes.includes(file.type) || file.size > maxSize) continue;

            const url = URL.createObjectURL(file);
            if (assignPrimary) {
                updated = updated.map(a => ({ ...a, isPrimary: false }));
            }

            updated.push({
                url,
                type: 'image',
                isPrimary: assignPrimary,
                metadata: { alt: file.name.replace(/\.[^/.]+$/, '') }
            });
            this.fileSelected.emit({ url, file });
            assignPrimary = false;
        }

        this.assets.set(updated);
    }

    removeImage(url: string): void {
        const remaining = this.assets().filter(a => a.url !== url);
        if (remaining.length > 0 && !remaining.some(asset => asset.isPrimary)) {
            remaining[0] = { ...remaining[0], isPrimary: true };
        }
        this.assets.set(remaining);
        URL.revokeObjectURL(url);
    }

    setPrimary(url: string): void {
        this.assets.set(this.assets().map(a => ({ ...a, isPrimary: a.url === url })));
    }
}
