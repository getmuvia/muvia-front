import { TranslatePipe, UiTextPipe } from '@core/services/i18n/translation-pipes';
import { Component, computed, effect, input, output, signal } from '@angular/core';

@Component({
  selector: 'app-image-editor-modal',
  imports: [TranslatePipe, UiTextPipe],
  standalone: true,
  template: `
    @if (isOpen()) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 scrim backdrop-blur-sm"
        (click)="onBackdropClick($event)"
      >
        <div
          class="bg-canvas rounded-dialog w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-fade-in-up"
          role="dialog"
          aria-modal="true"
          aria-labelledby="image-editor-title"
          (click)="$event.stopPropagation()"
        >
          <!-- Header -->
          <div
            class="px-6 py-4 border-b border-line flex justify-between items-center bg-canvas sticky top-0 z-10"
          >
            <h3 id="image-editor-title" class="text-ink type-card-title">
              {{ title() | uiText }}
            </h3>
            <button
              type="button"
              (click)="close()"
              [attr.aria-label]="'common.close' | translate"
              [disabled]="isLoading()"
              class="text-ink hover:text-ink transition-colors rounded-full p-1 hover:bg-paper disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span class="material-symbols-outlined icon-lg">close</span>
            </button>
          </div>

          <!-- Body -->
          <div class="p-6 flex flex-col items-center gap-6 overflow-y-auto">
            <!-- Preview Area -->
            <div
              class="relative w-full aspect-video bg-paper rounded-panel overflow-hidden border-2 border-dashed border-line flex items-center justify-center group cursor-pointer transition-colors hover:bg-paper hover:border-ink"
              role="button"
              tabindex="0"
              [attr.aria-label]="'seller.selectImage' | translate"
              aria-describedby="profile-image-help profile-image-error"
              [attr.aria-disabled]="isLoading()"
              [attr.tabindex]="isLoading() ? -1 : 0"
              (click)="!isLoading() && fileInput.click()"
              (keydown.enter)="!isLoading() && fileInput.click()"
              (keydown.space)="!isLoading() && fileInput.click(); $event.preventDefault()"
            >
              @if (previewUrl()) {
                <img
                  [src]="previewUrl()"
                  class="w-full h-full object-cover"
                  [alt]="'seller.preview' | translate"
                />

                <!-- Avatar Pro Stencil Overlay -->
                @if (mode() === 'avatar') {
                  <div
                    class="absolute inset-0 pointer-events-none flex items-center justify-center"
                  >
                    <!-- Circular Guide: Fixed size relative to container height -->
                    <div
                      class="crop-guide relative box-content aspect-square h-5/6 rounded-full border-2 border-canvas"
                    ></div>
                  </div>
                }

                <div
                  class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                >
                  <div
                    class="bg-ink backdrop-blur-md px-4 py-2 rounded-control text-canvas font-medium text-sm flex items-center gap-2 border border-canvas"
                  >
                    <span class="material-symbols-outlined icon-md">edit</span>
                    {{ 'seller.change' | translate }}
                  </div>
                </div>
              } @else {
                <div class="flex flex-col items-center gap-3 text-ink">
                  <span class="material-symbols-outlined icon-2xl">add_photo_alternate</span>
                  <span class="text-sm font-medium">{{
                    'seller.clickToUploadAnImage' | translate
                  }}</span>
                </div>
              }
            </div>

            <input
              #fileInput
              type="file"
              class="hidden"
              [disabled]="isLoading()"
              (change)="onFileSelected($event)"
              aria-describedby="profile-image-help profile-image-error"
              accept="image/png, image/jpeg, image/webp"
            />

            <p id="profile-image-help" class="text-center text-ink px-4 type-body">
              {{ 'seller.supportedFormatsPngJpgOrWebpMaximum5Mb' | translate }}
            </p>

            @if (displayedError()) {
              <p
                id="profile-image-error"
                class="w-full rounded-control border border-error/20 bg-error/5 p-3 font-medium text-error type-body"
                role="alert"
              >
                {{ displayedError() | uiText }}
              </p>
            }
          </div>

          <!-- Footer -->
          <div class="p-4 border-t border-line flex justify-end gap-3 bg-paper">
            <button
              type="button"
              (click)="close()"
              [disabled]="isLoading()"
              class="px-4 py-2 rounded-control font-medium text-ink hover:bg-mist transition-colors disabled:cursor-not-allowed disabled:opacity-50 type-control"
            >
              {{ 'common.cancel' | translate }}
            </button>
            <button
              type="button"
              (click)="onSave()"
              [disabled]="!selectedFile() || isLoading()"
              class="px-6 py-2 rounded-control font-bold text-canvas bg-ink hover:bg-sand hover:text-ink transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 type-control"
            >
              @if (isLoading()) {
                <span class="material-symbols-outlined icon-md animate-spin">refresh</span>
              } @else {
                <span class="material-symbols-outlined icon-md">check</span>
              }
              {{ 'common.save' | translate }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: `
    .crop-guide::before {
      position: absolute;
      inset: 0;
      border-radius: inherit;
      box-shadow: 0 0 0 100vmax var(--color-ink);
      opacity: 0.6;
      content: '';
    }
  `,
})
export class ImageEditorModal {
  readonly isOpen = input<boolean>(false);
  readonly title = input<string>('Editar Imagen');
  readonly currentImageUrl = input<string>('');
  readonly mode = input<'cover' | 'avatar'>('cover');

  readonly isLoading = input<boolean>(false);
  readonly errorMessage = input<string | null>(null);

  readonly save = output<File>();
  readonly cancel = output<void>();
  readonly selectionChange = output<void>();

  previewUrl = signal<string>('');
  selectedFile = signal<File | null>(null);
  fileError = signal<string | null>(null);
  displayedError = computed(() => this.fileError() ?? this.errorMessage());

  constructor() {
    effect(() => {
      if (!this.isOpen()) {
        this.reset();
      }
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const validTypes = ['image/png', 'image/jpeg', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        this.fileError.set(`No agregamos “${file.name}”: usa un archivo PNG, JPG o WEBP.`);
        input.value = '';
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        this.fileError.set(
          `No agregamos “${file.name}”: supera el límite de 5 MB. Reduce su tamaño e inténtalo nuevamente.`,
        );
        input.value = '';
        return;
      }

      this.fileError.set(null);
      this.selectedFile.set(file);
      this.selectionChange.emit();

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => this.previewUrl.set(e.target?.result as string);
      reader.readAsDataURL(file);
    }
    input.value = '';
  }

  onSave() {
    const file = this.selectedFile();
    if (file) {
      this.save.emit(file);
    }
  }

  close() {
    if (this.isLoading()) return;
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
    this.fileError.set(null);
  }
}
