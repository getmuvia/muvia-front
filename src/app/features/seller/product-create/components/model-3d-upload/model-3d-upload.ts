import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CreateProductAsset } from '@core/models/product/create-product.dto';

@Component({
    selector: 'app-model-3d-upload',
    imports: [],
    templateUrl: './model-3d-upload.html',
    styleUrl: './model-3d-upload.css',
})
export class Model3dUpload {
    @Input() asset: CreateProductAsset | null = null;
    @Output() assetChange = new EventEmitter<CreateProductAsset | null>();

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
        const validExtensions = ['.glb', '.gltf'];
        const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

        if (!validExtensions.includes(extension)) {
            console.warn('Invalid file type. Only GLB/GLTF allowed.');
            return;
        }

        // Create temporary URL for preview
        const url = URL.createObjectURL(file);

        const newAsset: CreateProductAsset = {
            url,
            type: 'model_3d',
            isPrimary: false,
            metadata: {
                format: extension.replace('.', ''),
                scale: '1:1',
                arPlacement: 'floor'
            }
        };

        this.assetChange.emit(newAsset);
    }

    removeModel(): void {
        this.assetChange.emit(null);
    }
}
