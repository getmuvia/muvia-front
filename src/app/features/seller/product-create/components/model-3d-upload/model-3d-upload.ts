import { Component, input, output, signal } from '@angular/core';
import { CreateProductAsset } from '@core/models/product/create-product.dto';

@Component({
    selector: 'app-model-3d-upload',
    imports: [],
    templateUrl: './model-3d-upload.html',
    styleUrl: './model-3d-upload.css',
})
export class Model3dUpload {
    asset = input<CreateProductAsset | null>(null);
    assetChange = output<CreateProductAsset | null>();

    isDragging = signal(false);

    onDragOver(event: DragEvent): void {
        event.preventDefault();
        this.isDragging.set(true);
    }

    onDragLeave(): void {
        this.isDragging.set(false);
    }

    onDrop(event: DragEvent): void {
        event.preventDefault();
        this.isDragging.set(false);
        const files = event.dataTransfer?.files;
        if (files && files.length > 0) {
            this.handleFile(files[0]);
        }
    }

    onFileSelect(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            this.handleFile(input.files[0]);
        }
        input.value = '';
    }

    private handleFile(file: File): void {
        const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
        if (!['.glb', '.gltf'].includes(ext)) return;

        this.assetChange.emit({
            url: URL.createObjectURL(file),
            type: 'model_3d',
            isPrimary: false,
            metadata: { format: ext.replace('.', ''), scale: '1:1', arPlacement: 'floor' }
        });
    }

    removeModel(): void {
        this.assetChange.emit(null);
    }
}
