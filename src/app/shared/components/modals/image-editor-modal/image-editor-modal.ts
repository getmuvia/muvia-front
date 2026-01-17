import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-image-editor-modal',
    standalone: true,
    imports: [CommonModule],
    template: `
    @if (isOpen()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" (click)="onBackdropClick($event)">
        <div class="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-fade-in-up" (click)="$event.stopPropagation()">
            
            <!-- Header -->
            <div class="px-6 py-4 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-white dark:bg-zinc-900 sticky top-0 z-10">
                <h3 class="text-lg font-bold text-gray-900 dark:text-white">{{ title() }}</h3>
                <button (click)="close()" class="text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-white transition-colors rounded-full p-1 hover:bg-gray-100 dark:hover:bg-white/10">
                    <span class="material-symbols-outlined text-xl">close</span>
                </button>
            </div>

            <!-- Body -->
            <div class="p-6 flex flex-col items-center gap-6 overflow-y-auto">
                
                <!-- Preview Area -->
                <div class="relative w-full aspect-video bg-gray-100 dark:bg-white/5 rounded-xl overflow-hidden border-2 border-dashed border-gray-300 dark:border-white/20 flex items-center justify-center group cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-white/10 hover:border-primary"
                    (click)="fileInput.click()">
                    
                    @if (previewUrl()) {
                        <img [src]="previewUrl()" class="w-full h-full object-cover" alt="Preview">
                        
                        <!-- Avatar Pro Stencil Overlay -->
                        @if (mode() === 'avatar') {
                        <div class="absolute inset-0 pointer-events-none flex items-center justify-center">
                            <!-- Circular Guide: Fixed size relative to container height -->
                            <div class="h-5/6 aspect-square rounded-full border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] box-content"></div>
                        </div>
                        }

                        <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                             <div class="bg-black/60 backdrop-blur-md px-4 py-2 rounded-full text-white font-medium text-sm flex items-center gap-2 border border-white/20">
                                <span class="material-symbols-outlined text-lg">edit</span> Cambiar
                             </div>
                        </div>
                    } @else {
                        <div class="flex flex-col items-center gap-3 text-gray-400 dark:text-white/40">
                             <span class="material-symbols-outlined text-4xl">add_photo_alternate</span>
                             <span class="text-sm font-medium">Haz clic para subir una imagen</span>
                        </div>
                    }
                </div>

                <input #fileInput type="file" class="hidden" (change)="onFileSelected($event)" accept="image/png, image/jpeg, image/webp">

                <p class="text-xs text-center text-gray-500 dark:text-gray-400 px-4">
                    Se recomienda una imagen de alta resolución. Formatos soportados: PNG, JPG, WEBP.
                </p>

            </div>

            <!-- Footer -->
            <div class="p-4 border-t border-gray-100 dark:border-white/10 flex justify-end gap-3 bg-gray-50 dark:bg-zinc-800/50">
                <button (click)="close()" 
                    class="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">
                    Cancelar
                </button>
                <button (click)="onSave()" 
                    [disabled]="!selectedFile()"
                    class="px-6 py-2 rounded-lg text-sm font-bold text-white bg-primary hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20 flex items-center gap-2">
                    <span class="material-symbols-outlined text-lg">check</span>
                    Guardar
                </button>
            </div>
        </div>
      </div>
    }
  `,
    styles: [`
    @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(10px) scale(0.98); }
        to { opacity: 1; transform: translateY(0) scale(1); }
    }
    .animate-fade-in-up {
        animation: fadeInUp 0.2s ease-out forwards;
    }
  `]
})
export class ImageEditorModal {
    isOpen = input<boolean>(false);
    title = input<string>('Editar Imagen');
    currentImageUrl = input<string>('');
    mode = input<'cover' | 'avatar'>('cover');

    save = output<File>();
    cancel = output<void>();

    previewUrl = signal<string>('');
    selectedFile = signal<File | null>(null);

    onFileSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files[0]) {
            const file = input.files[0];
            this.selectedFile.set(file);

            // Create preview
            const reader = new FileReader();
            reader.onload = (e) => this.previewUrl.set(e.target?.result as string);
            reader.readAsDataURL(file);
        }
    }

    onSave() {
        const file = this.selectedFile();
        if (file) {
            this.save.emit(file);
        }
    }

    close() {
        this.cancel.emit();
        this.reset();
    }

    onBackdropClick(event: MouseEvent) {
        if (event.target === event.currentTarget) {
            this.close();
        }
    }

    reset() {
        this.selectedFile.set(null);
        this.previewUrl.set('');
    }
}
