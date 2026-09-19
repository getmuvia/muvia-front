import { Component, ElementRef, effect, inject, input, output } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors } from '@angular/forms';
import { BusinessHours, SocialLink } from '@core/models/user/vendor-profile';

export interface SidebarFormData {
    aboutMe: string;
    businessHours: BusinessHours;
    socialLinks: SocialLink[];
}

@Component({
    selector: 'app-sidebar-edit-modal',
    standalone: true,
    imports: [ReactiveFormsModule],
    template: `
    @if (isOpen()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" (click)="close()">
        <div class="bg-white rounded-dialog shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-fade-in-up"
            role="dialog" aria-modal="true" aria-labelledby="sidebar-edit-title" (click)="$event.stopPropagation()">
            
            <!-- Header -->
            <div class="px-6 py-4 border-b border-text-light/10 flex justify-between items-center bg-white sticky top-0 z-10">
                <h3 id="sidebar-edit-title" class="text-lg font-bold text-text-light">Editar Información</h3>
                <button type="button" (click)="close()" aria-label="Cerrar" [disabled]="isLoading()"
                    class="text-text-light/40 hover:text-gray-600 transition-colors rounded-full p-1 hover:bg-surface-element disabled:opacity-50">
                    <span class="material-symbols-outlined text-xl">close</span>
                </button>
            </div>

            <!-- Body -->
            <div class="p-6 overflow-y-auto flex flex-col gap-6" [formGroup]="form"
                (input)="formChange.emit()" (change)="formChange.emit()">
                @if (errorMessage()) {
                <p class="rounded-control border border-error/20 bg-error/5 p-3 text-sm font-medium text-error"
                    role="alert">
                    {{ errorMessage() }}
                </p>
                }

                @if (form.invalid && form.touched) {
                <p class="rounded-control border border-error/20 bg-error/5 p-3 text-sm font-bold text-error"
                    role="alert">
                    Revisa los enlaces sociales indicados antes de guardar.
                </p>
                }
                
                <!-- About Me -->
                <div class="flex flex-col gap-2">
                    <label class="text-sm font-bold text-text-light">Sobre Nosotros</label>
                    <textarea formControlName="aboutMe" rows="4" 
                        class="w-full px-4 py-2 rounded-control border border-text-light/20 bg-surface-element text-text-light focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                        placeholder="Descripción de tu negocio..."></textarea>
                </div>

                <!-- Business Hours -->
                <div class="flex flex-col gap-3">
                    <label class="text-sm font-bold text-text-light">Horario de Atención</label>
                    <div class="flex flex-col gap-2 bg-surface-element p-4 rounded-panel border border-text-light/10">
                        <div formGroupName="businessHours">
                            @for (day of weekDays; track day.key) {
                                <div [formGroupName]="day.key" class="flex flex-wrap items-center gap-3 py-1 border-b border-text-light/10 last:border-0 hover:bg-white/50 px-2 rounded-panel transition-colors">
                                    <span class="w-24 text-sm font-medium text-text-light">{{ day.label }}</span>
                                    
                                    <label class="flex items-center gap-2 cursor-pointer select-none">
                                        <input type="checkbox" formControlName="isClosed" class="accent-primary w-4 h-4 rounded-control">
                                        <span class="text-xs text-text-light/60">Cerrado</span>
                                    </label>

                                    @if (!form.get('businessHours')?.get(day.key)?.get('isClosed')?.value) {
                                        <div class="flex items-center gap-2 ml-auto sm:ml-0">
                                            <input type="time" formControlName="open" class="px-2 py-1 rounded-control border border-text-light/20 bg-surface-element text-text-light text-sm">
                                            <span class="text-text-light/40">-</span>
                                            <input type="time" formControlName="close" class="px-2 py-1 rounded-control border border-text-light/20 bg-surface-element text-text-light text-sm">
                                        </div>
                                    }
                                </div>
                            }
                        </div>
                    </div>
                </div>

                <!-- Social Links -->
                <div class="flex flex-col gap-3">
                     <div class="flex justify-between items-center">
                        <label class="text-sm font-bold text-text-light">Redes Sociales</label>
                        <button type="button" (click)="addSocialLink()" class="text-primary hover:text-primary-600 text-sm font-bold flex items-center gap-1">
                            <span class="material-symbols-outlined text-lg">add</span> Agregar
                        </button>
                    </div>

                    <div formArrayName="socialLinks" class="flex flex-col gap-3">
                        @for (link of socialLinksControls.controls; track $index) {
                            <div [formGroupName]="$index" class="flex flex-col gap-1 animate-fade-in-up">
                                <div class="flex items-center gap-2">
                                <select formControlName="icon" [attr.aria-label]="'Tipo de enlace social ' + ($index + 1)"
                                    class="px-3 py-2 rounded-control border border-text-light/20 bg-surface-element text-text-light text-sm max-w-[120px]">
                                    <option value="language">Web</option>
                                    <option value="instagram">Instagram</option>
                                    <option value="facebook">Facebook</option>
                                    <option value="twitter">Twitter</option>
                                    <option value="pinterest">Pinterest</option>
                                </select>
                                <input [id]="'social-name-' + $index" type="text" formControlName="name"
                                    [attr.aria-label]="'Nombre del enlace social ' + ($index + 1)"
                                    [attr.aria-invalid]="isSocialFieldInvalid($index, 'name')"
                                    [attr.aria-describedby]="isSocialFieldInvalid($index, 'name') ? 'social-name-error-' + $index : null"
                                    placeholder="Nombre (ej. Instagram)" class="flex-1 px-3 py-2 rounded-control border border-text-light/20 bg-surface-element text-text-light placeholder:text-text-light/60 text-sm w-0 min-w-[80px]">
                                <input [id]="'social-url-' + $index" type="url" formControlName="url"
                                    [attr.aria-label]="'Dirección del enlace social ' + ($index + 1)"
                                    [attr.aria-invalid]="isSocialFieldInvalid($index, 'url')"
                                    [attr.aria-describedby]="isSocialFieldInvalid($index, 'url') ? 'social-url-error-' + $index : null"
                                    placeholder="URL (https://...)" class="flex-[2] px-3 py-2 rounded-control border border-text-light/20 bg-surface-element text-text-light placeholder:text-text-light/60 text-sm w-0 min-w-[120px]">
                                <button type="button" (click)="removeSocialLink($index)" [attr.aria-label]="'Eliminar enlace social ' + ($index + 1)"
                                    class="p-2 text-red-500 hover:bg-red-50 rounded-control">
                                    <span class="material-symbols-outlined text-lg">delete</span>
                                </button>
                                </div>
                                @if (isSocialFieldInvalid($index, 'name')) {
                                <p [id]="'social-name-error-' + $index" class="text-xs font-medium text-error" role="alert">
                                    Ingresa un nombre para este enlace.
                                </p>
                                }
                                @if (isSocialFieldInvalid($index, 'url')) {
                                <p [id]="'social-url-error-' + $index" class="text-xs font-medium text-error" role="alert">
                                    {{ getSocialUrlError($index) }}
                                </p>
                                }
                            </div>
                        }
                    </div>
                </div>

            </div>

             <!-- Footer -->
            <div class="p-4 border-t border-text-light/10 flex justify-end gap-3 bg-surface-element">
                <button type="button" (click)="close()" [disabled]="isLoading()"
                    class="px-4 py-2 rounded-control text-sm font-medium text-text-light hover:bg-gray-200 transition-colors">
                    Cancelar
                </button>
                <button type="button" (click)="onSubmit()"
                    [disabled]="isLoading() || form.pristine"
                    class="px-6 py-2 rounded-control text-sm font-bold text-white bg-primary hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20 flex items-center gap-2">
                    @if (isLoading()) {
                        <span class="material-symbols-outlined text-lg animate-spin">refresh</span>
                    } @else {
                        <span class="material-symbols-outlined text-lg">save</span>
                    }
                    Guardar
                </button>
            </div>
        </div>
      </div>
    }
  `,
    styles: []
})
export class SidebarEditModal {
    readonly isOpen = input(false);
    readonly initialData = input<SidebarFormData | null>(null);
    readonly isLoading = input(false);
    readonly errorMessage = input<string | null>(null);

    readonly save = output<SidebarFormData>();
    readonly closeModal = output<void>();
    readonly formChange = output<void>();

    private readonly fb = inject(FormBuilder);
    private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
    readonly form: FormGroup;

    weekDays = [
        { key: 'monday', label: 'Lunes' },
        { key: 'tuesday', label: 'Martes' },
        { key: 'wednesday', label: 'Miércoles' },
        { key: 'thursday', label: 'Jueves' },
        { key: 'friday', label: 'Viernes' },
        { key: 'saturday', label: 'Sábado' },
        { key: 'sunday', label: 'Domingo' }
    ];

    constructor() {
        this.form = this.fb.group({
            aboutMe: [''],
            businessHours: this.fb.group({}),
            socialLinks: this.fb.array([])
        });

        this.weekDays.forEach(day => {
            (this.form.get('businessHours') as FormGroup).addControl(day.key, this.fb.group({
                open: ['09:00'],
                close: ['18:00'],
                isClosed: [false]
            }));
        });

        effect(() => {
            const data = this.initialData();
            if (this.isOpen() && data) {
                this.patchForm(data);
            }
        });
    }

    get socialLinksControls() {
        return this.form.get('socialLinks') as FormArray;
    }

    addSocialLink(data: SocialLink = { name: '', url: '', icon: 'language' }): void {
        this.socialLinksControls.push(this.fb.group({
            name: [data.name],
            url: [data.url],
            icon: [data.icon]
        }, { validators: control => this.validateSocialLink(control) }));
    }

    removeSocialLink(index: number): void {
        this.socialLinksControls.removeAt(index);
        this.form.markAsDirty();
    }

    private patchForm(data: SidebarFormData): void {
        this.form.patchValue({
            aboutMe: data.aboutMe || ''
        })

        if (data.businessHours) {
            Object.keys(data.businessHours).forEach(key => {
                if (this.weekDays.some(d => d.key === key)) {
                    this.form.get('businessHours')?.get(key)?.patchValue(data.businessHours[key]);
                }
            });
        }

        this.socialLinksControls.clear();
        if (data.socialLinks && Array.isArray(data.socialLinks)) {
            data.socialLinks.forEach((link: SocialLink) => this.addSocialLink(link));
        } else {
            this.addSocialLink();
        }
        this.form.markAsPristine();
        this.form.markAsUntouched();
    }

    onSubmit(): void {
        this.form.markAllAsTouched();
        if (this.form.invalid || this.isLoading()) {
            queueMicrotask(() => {
                this.host.nativeElement.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
            });
            return;
        }

        if (this.form.valid) {
            const formValue = this.form.getRawValue() as SidebarFormData;
            formValue.socialLinks = formValue.socialLinks
                .filter(link => link.name.trim() || link.url.trim())
                .map(link => ({
                    ...link,
                    name: link.name.trim(),
                    url: link.url.trim(),
                }));

            if (formValue.businessHours) {
                Object.values(formValue.businessHours).forEach(day => {
                    if (day.isClosed) {
                        day.open = '00:00';
                        day.close = '00:00';
                    }
                });
            }

            this.save.emit(formValue);
        }
    }

    close(): void {
        if (!this.isLoading()) this.closeModal.emit();
    }

    isSocialFieldInvalid(index: number, field: 'name' | 'url'): boolean {
        const group = this.socialLinksControls.at(index);
        if (!group.touched) return false;
        return field === 'name'
            ? group.hasError('nameRequired')
            : group.hasError('urlRequired') || group.hasError('urlPattern');
    }

    getSocialUrlError(index: number): string {
        const group = this.socialLinksControls.at(index);
        return group.hasError('urlRequired')
            ? 'Ingresa la dirección del enlace.'
            : 'Usa una dirección completa que comience con http:// o https://.';
    }

    private validateSocialLink(control: AbstractControl): ValidationErrors | null {
        const name = String(control.get('name')?.value ?? '').trim();
        const url = String(control.get('url')?.value ?? '').trim();
        if (!name && !url) return null;

        const errors: ValidationErrors = {};
        if (!name) errors['nameRequired'] = true;
        if (!url) {
            errors['urlRequired'] = true;
        } else if (!/^https?:\/\/.+/i.test(url)) {
            errors['urlPattern'] = true;
        }

        return Object.keys(errors).length > 0 ? errors : null;
    }
}
