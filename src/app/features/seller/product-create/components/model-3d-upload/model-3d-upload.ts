import { Component, input, output, signal, ChangeDetectionStrategy } from '@angular/core';
import { CreateProductAsset } from '@core/models/product/create-product.dto';

@Component({
    selector: 'app-model-3d-upload',
    imports: [],
    templateUrl: './model-3d-upload.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './model-3d-upload.css',
})
export class Model3dUpload {
    // Separate inputs for GLB and USDZ
    glbAsset = input<CreateProductAsset | null>(null);
    usdzAsset = input<CreateProductAsset | null>(null);

    // Separate outputs for each format
    glbAssetChange = output<CreateProductAsset | null>();
    usdzAssetChange = output<CreateProductAsset | null>();
    glbFileSelected = output<{ url: string; file: File }>();
    usdzFileSelected = output<{ url: string; file: File }>();

    isDraggingGlb = signal(false);
    isDraggingUsdz = signal(false);

    // GLB/GLTF handlers
    onDragOverGlb(event: DragEvent): void {
        event.preventDefault();
        this.isDraggingGlb.set(true);
    }

    onDragLeaveGlb(): void {
        this.isDraggingGlb.set(false);
    }

    onDropGlb(event: DragEvent): void {
        event.preventDefault();
        this.isDraggingGlb.set(false);
        const files = event.dataTransfer?.files;
        if (files && files.length > 0) {
            this.handleGlbFile(files[0]);
        }
    }

    onFileSelectGlb(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            this.handleGlbFile(input.files[0]);
        }
        input.value = '';
    }

    private handleGlbFile(file: File): void {
        const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
        if (!['.glb', '.gltf'].includes(ext)) return;

        const url = URL.createObjectURL(file);
        this.glbAssetChange.emit({
            url,
            type: 'model_3d',
            isPrimary: false,
            metadata: { format: ext.replace('.', ''), scale: '1:1', arPlacement: 'floor' }
        });
        this.glbFileSelected.emit({ url, file });
    }

    removeGlbModel(): void {
        this.glbAssetChange.emit(null);
    }

    // USDZ handlers
    onDragOverUsdz(event: DragEvent): void {
        event.preventDefault();
        this.isDraggingUsdz.set(true);
    }

    onDragLeaveUsdz(): void {
        this.isDraggingUsdz.set(false);
    }

    onDropUsdz(event: DragEvent): void {
        event.preventDefault();
        this.isDraggingUsdz.set(false);
        const files = event.dataTransfer?.files;
        if (files && files.length > 0) {
            this.handleUsdzFile(files[0]);
        }
    }

    onFileSelectUsdz(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            this.handleUsdzFile(input.files[0]);
        }
        input.value = '';
    }

    private handleUsdzFile(file: File): void {
        const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
        if (ext !== '.usdz') return;

        const url = URL.createObjectURL(file);
        this.usdzAssetChange.emit({
            url,
            type: 'model_3d',
            isPrimary: false,
            metadata: { format: 'usdz', scale: '1:1', arPlacement: 'floor' }
        });
        this.usdzFileSelected.emit({ url, file });
    }

    removeUsdzModel(): void {
        this.usdzAssetChange.emit(null);
    }
}
