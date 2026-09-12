import { Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

export interface ProfileMetadataFormData {
    businessName: string;
    description: string;
}

@Component({
    selector: 'app-profile-metadata-edit-modal',
    imports: [ReactiveFormsModule],
    template: `
        @if (isOpen()) {
            <div
                class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
                (click)="onBackdropClick($event)"
            >
                <div
                    class="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-dialog bg-white shadow-2xl animate-fade-in-up"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="profile-metadata-title"
                    (click)="$event.stopPropagation()"
                >
                    <div class="flex items-center justify-between border-b border-text-light/10 px-6 py-4">
                        <h3 id="profile-metadata-title" class="text-lg font-bold text-text-light">
                            Editar perfil
                        </h3>
                        <button
                            type="button"
                            class="rounded-full p-1 text-text-light/40 transition-colors hover:bg-surface-element hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
                            aria-label="Cerrar"
                            [disabled]="isLoading()"
                            (click)="close()"
                        >
                            <span class="material-symbols-outlined text-xl" aria-hidden="true">close</span>
                        </button>
                    </div>

                    <form [formGroup]="form" (ngSubmit)="onSubmit()">
                        <div class="flex flex-col gap-5 overflow-y-auto p-6">
                            <div class="flex flex-col gap-2">
                                <label for="business-name" class="text-sm font-bold text-text-light">
                                    Nombre del vendedor
                                </label>
                                <input
                                    id="business-name"
                                    type="text"
                                    formControlName="businessName"
                                    maxlength="255"
                                    autocomplete="organization"
                                    class="w-full rounded-control border border-text-light/20 bg-surface-element px-4 py-2 text-text-light focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    [attr.aria-invalid]="businessName.invalid && businessName.touched"
                                    aria-describedby="business-name-help"
                                />
                                <div id="business-name-help" class="min-h-5 text-xs">
                                    @if (businessName.touched && businessName.hasError('required')) {
                                        <span class="text-error">El nombre del vendedor es obligatorio.</span>
                                    } @else if (businessName.touched && businessName.hasError('pattern')) {
                                        <span class="text-error">El nombre no puede contener solo espacios.</span>
                                    } @else if (businessName.touched && businessName.hasError('maxlength')) {
                                        <span class="text-error">El nombre no puede superar los 255 caracteres.</span>
                                    }
                                </div>
                            </div>

                            <div class="flex flex-col gap-2">
                                <label for="seller-description" class="text-sm font-bold text-text-light">
                                    Descripción
                                </label>
                                <textarea
                                    id="seller-description"
                                    formControlName="description"
                                    rows="4"
                                    class="w-full resize-none rounded-control border border-text-light/20 bg-surface-element px-4 py-2 text-text-light focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    placeholder="Describe brevemente tu negocio..."
                                ></textarea>
                                <p class="text-xs text-text-light/60">
                                    Puedes dejarla vacía si todavía no deseas mostrar una descripción.
                                </p>
                            </div>
                        </div>

                        <div class="flex justify-end gap-3 border-t border-text-light/10 bg-surface-element p-4">
                            <button
                                type="button"
                                class="rounded-control px-4 py-2 text-sm font-medium text-text-light transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
                                [disabled]="isLoading()"
                                (click)="close()"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                class="flex items-center gap-2 rounded-control bg-primary px-6 py-2 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
                                [disabled]="form.invalid || form.pristine || isLoading()"
                            >
                                @if (isLoading()) {
                                    <span class="material-symbols-outlined animate-spin text-lg" aria-hidden="true">refresh</span>
                                } @else {
                                    <span class="material-symbols-outlined text-lg" aria-hidden="true">save</span>
                                }
                                Guardar
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        }
    `,
})
export class ProfileMetadataEditModal {
    readonly isOpen = input(false);
    readonly initialData = input<ProfileMetadataFormData | null>(null);
    readonly isLoading = input(false);

    readonly save = output<ProfileMetadataFormData>();
    readonly closeModal = output<void>();

    private readonly fb = inject(FormBuilder);
    readonly form = this.fb.nonNullable.group({
        businessName: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(255)]],
        description: [''],
    });

    readonly businessName = this.form.controls.businessName;

    constructor() {
        effect(() => {
            const data = this.initialData();
            if (!this.isOpen() || !data) return;

            this.form.setValue({
                businessName: data.businessName,
                description: data.description,
            });
            this.form.markAsPristine();
            this.form.markAsUntouched();
        });
    }

    onSubmit(): void {
        this.form.markAllAsTouched();
        if (this.form.invalid || this.isLoading()) return;

        const value = this.form.getRawValue();
        this.save.emit({
            businessName: value.businessName.trim(),
            description: value.description.trim(),
        });
    }

    close(): void {
        if (!this.isLoading()) {
            this.closeModal.emit();
        }
    }

    onBackdropClick(event: MouseEvent): void {
        if (event.target === event.currentTarget) {
            this.close();
        }
    }
}
