import { Component, input, model, output, signal } from '@angular/core';
import { CreateProductAsset } from '@core/models/product/create-product.dto';

@Component({
    selector: 'app-model-3d-upload',
    imports: [],
    templateUrl: './model-3d-upload.html',
    styleUrl: './model-3d-upload.css',
})
export class Model3dUpload {
    // Separate inputs for GLB and USDZ
    readonly glbAsset = model<CreateProductAsset | null>(null);
    readonly usdzAsset = model<CreateProductAsset | null>(null);
    readonly disabled = input(false);

    readonly glbFileSelected = output<{ url: string; file: File }>();
    readonly usdzFileSelected = output<{ url: string; file: File }>();

    isDraggingGlb = signal(false);
    isDraggingUsdz = signal(false);
    glbFileError = signal<string | null>(null);
    usdzFileError = signal<string | null>(null);
    readonly maxModelSize = 50 * 1024 * 1024;

    // GLB/GLTF handlers
    onDragOverGlb(event: DragEvent): void {
        event.preventDefault();
        if (this.disabled()) return;
        this.isDraggingGlb.set(true);
    }

    onDragLeaveGlb(): void {
        this.isDraggingGlb.set(false);
    }

    onDropGlb(event: DragEvent): void {
        event.preventDefault();
        this.isDraggingGlb.set(false);
        if (this.disabled()) return;
        const files = event.dataTransfer?.files;
        if (files && files.length > 0) {
            this.handleGlbFile(files[0]);
        }
    }

    onFileSelectGlb(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (!this.disabled() && input.files && input.files.length > 0) {
            this.handleGlbFile(input.files[0]);
        }
        input.value = '';
    }

    private handleGlbFile(file: File): void {
        const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
        if (!['.glb', '.gltf'].includes(ext)) {
            this.glbFileError.set(`No agregamos “${file.name}”: usa un archivo GLB o GLTF.`);
            return;
        }
        if (file.size > this.maxModelSize) {
            this.glbFileError.set(`No agregamos “${file.name}”: supera el límite de 50 MB. Optimiza el modelo e inténtalo nuevamente.`);
            return;
        }

        const previousUrl = this.glbAsset()?.url;
        if (previousUrl?.startsWith('blob:')) URL.revokeObjectURL(previousUrl);
        const url = URL.createObjectURL(file);
        this.glbAsset.set({
            url,
            type: 'model_3d',
            isPrimary: false,
            metadata: { format: ext.replace('.', ''), originalName: file.name, scale: '1:1', arPlacement: 'floor' }
        });
        this.glbFileError.set(null);
        this.glbFileSelected.emit({ url, file });
    }

    removeGlbModel(): void {
        if (this.disabled()) return;
        const url = this.glbAsset()?.url;
        this.glbAsset.set(null);
        if (url?.startsWith('blob:')) URL.revokeObjectURL(url);
        this.glbFileError.set(null);
    }

    // USDZ handlers
    onDragOverUsdz(event: DragEvent): void {
        event.preventDefault();
        if (this.disabled()) return;
        this.isDraggingUsdz.set(true);
    }

    onDragLeaveUsdz(): void {
        this.isDraggingUsdz.set(false);
    }

    onDropUsdz(event: DragEvent): void {
        event.preventDefault();
        this.isDraggingUsdz.set(false);
        if (this.disabled()) return;
        const files = event.dataTransfer?.files;
        if (files && files.length > 0) {
            this.handleUsdzFile(files[0]);
        }
    }

    onFileSelectUsdz(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (!this.disabled() && input.files && input.files.length > 0) {
            this.handleUsdzFile(input.files[0]);
        }
        input.value = '';
    }

    private handleUsdzFile(file: File): void {
        const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
        if (ext !== '.usdz') {
            this.usdzFileError.set(`No agregamos “${file.name}”: usa un archivo USDZ.`);
            return;
        }
        if (file.size > this.maxModelSize) {
            this.usdzFileError.set(`No agregamos “${file.name}”: supera el límite de 50 MB. Optimiza el modelo e inténtalo nuevamente.`);
            return;
        }

        const previousUrl = this.usdzAsset()?.url;
        if (previousUrl?.startsWith('blob:')) URL.revokeObjectURL(previousUrl);
        const url = URL.createObjectURL(file);
        this.usdzAsset.set({
            url,
            type: 'model_3d',
            isPrimary: false,
            metadata: { format: 'usdz', originalName: file.name, scale: '1:1', arPlacement: 'floor' }
        });
        this.usdzFileError.set(null);
        this.usdzFileSelected.emit({ url, file });
    }

    removeUsdzModel(): void {
        if (this.disabled()) return;
        const url = this.usdzAsset()?.url;
        this.usdzAsset.set(null);
        if (url?.startsWith('blob:')) URL.revokeObjectURL(url);
        this.usdzFileError.set(null);
    }
}
