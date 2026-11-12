import { TranslatePipe, UiTextPipe } from '@core/services/i18n/translation-pipes';
import { Component, computed, input, model, output, signal } from '@angular/core';
import { CreateProductAsset } from '@core/models/product/create-product.dto';

@Component({
    selector: 'app-image-gallery-upload',
    imports: [TranslatePipe, UiTextPipe],
    templateUrl: './image-gallery-upload.html',
    styleUrl: './image-gallery-upload.css',
})
export class ImageGalleryUpload {
    readonly assets = model<CreateProductAsset[]>([]);
    readonly disabled = input(false);
    readonly fileSelected = output<{ url: string; file: File }>();

    isDragging = signal(false);
    fileErrors = signal<string[]>([]);
    readonly maxImages = 5;
    readonly maxFileSize = 5 * 1024 * 1024;
    readonly acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    primaryImage = computed(() => this.assets().find(a => a.isPrimary));
    secondaryImages = computed(() => this.assets().filter(a => !a.isPrimary));
    emptySlots = computed(() => {
        const count = Math.max(0, this.maxImages - Math.max(1, this.assets().length));
        return Array.from({ length: count }, (_, i) => i);
    });

    onDragOver(event: DragEvent): void {
        event.preventDefault();
        if (this.disabled()) return;
        this.isDragging.set(true);
    }

    onDragLeave(): void {
        this.isDragging.set(false);
    }

    onDrop(event: DragEvent): void {
        event.preventDefault();
        this.isDragging.set(false);
        if (this.disabled()) return;
        const files = event.dataTransfer?.files;
        if (files && files.length > 0) {
            this.handleFiles(files);
        }
    }

    onFileSelect(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (!this.disabled() && input.files && input.files.length > 0) {
            this.handleFiles(input.files);
        }
        input.value = '';
    }

    private handleFiles(files: FileList): void {
        const updated = [...this.assets()];
        const initialCount = updated.length;
        let assignPrimary = !updated.some(asset => asset.isPrimary);
        const errors: string[] = [];

        for (const file of Array.from(files)) {
            if (updated.length >= this.maxImages) {
                errors.push(`No agregamos “${file.name}”: el máximo es de ${this.maxImages} imágenes. Elimina una imagen antes de intentarlo nuevamente.`);
                continue;
            }
            if (!this.acceptedTypes.includes(file.type)) {
                errors.push(`No agregamos “${file.name}”: usa un archivo JPG, PNG o WEBP.`);
                continue;
            }
            if (file.size > this.maxFileSize) {
                errors.push(`No agregamos “${file.name}”: supera el límite de 5 MB. Reduce su tamaño e inténtalo nuevamente.`);
                continue;
            }

            const url = URL.createObjectURL(file);
            updated.push({
                url,
                type: 'image',
                isPrimary: assignPrimary,
                metadata: { alt: file.name.replace(/\.[^/.]+$/, '') }
            });
            this.fileSelected.emit({ url, file });
            assignPrimary = false;
        }

        if (updated.length > initialCount) this.assets.set(updated);
        this.fileErrors.set(errors);
    }

    removeImage(url: string): void {
        if (this.disabled()) return;
        const remaining = this.assets().filter(a => a.url !== url);
        if (remaining.length > 0 && !remaining.some(asset => asset.isPrimary)) {
            remaining[0] = { ...remaining[0], isPrimary: true };
        }
        this.assets.set(remaining);
        this.fileErrors.set([]);
    }

    setPrimary(url: string): void {
        if (this.disabled()) return;
        this.assets.set(this.assets().map(a => ({ ...a, isPrimary: a.url === url })));
    }
}
