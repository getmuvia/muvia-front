import { Component, input, output, signal, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { BusinessHours, SocialLink } from '@core/models/user/vendor-profile';

@Component({
    selector: 'app-sidebar-edit-modal',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    template: `
    @if (isOpen()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" (click)="close()">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-fade-in-up" (click)="$event.stopPropagation()">
            
            <!-- Header -->
            <div class="px-6 py-4 border-b border-text-light/10 flex justify-between items-center bg-white sticky top-0 z-10">
                <h3 class="text-lg font-bold text-text-light">Editar Información</h3>
                <button (click)="close()" class="text-text-light/40 hover:text-gray-600 transition-colors rounded-full p-1 hover:bg-surface-element">
                    <span class="material-symbols-outlined text-xl">close</span>
                </button>
            </div>

            <!-- Body -->
            <div class="p-6 overflow-y-auto flex flex-col gap-6" [formGroup]="form">
                
                <!-- About Me -->
                <div class="flex flex-col gap-2">
                    <label class="text-sm font-bold text-text-light">Sobre Nosotros</label>
                    <textarea formControlName="aboutMe" rows="4" 
                        class="w-full px-4 py-2 rounded-lg border border-text-light/20 bg-surface-element text-text-light focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                        placeholder="Descripción de tu negocio..."></textarea>
                </div>

                <!-- Business Hours -->
                <div class="flex flex-col gap-3">
                    <label class="text-sm font-bold text-text-light">Horario de Atención</label>
                    <div class="flex flex-col gap-2 bg-surface-element p-4 rounded-xl border border-text-light/10">
                        <div formGroupName="businessHours">
                            @for (day of weekDays; track day.key) {
                                <div [formGroupName]="day.key" class="flex flex-wrap items-center gap-3 py-1 border-b border-text-light/10 last:border-0 hover:bg-white/50 px-2 rounded-lg transition-colors">
                                    <span class="w-24 text-sm font-medium text-text-light">{{ day.label }}</span>
                                    
                                    <label class="flex items-center gap-2 cursor-pointer select-none">
                                        <input type="checkbox" formControlName="isClosed" class="accent-primary w-4 h-4 rounded">
                                        <span class="text-xs text-text-light/60">Cerrado</span>
                                    </label>

                                    @if (!form.get('businessHours')?.get(day.key)?.get('isClosed')?.value) {
                                        <div class="flex items-center gap-2 ml-auto sm:ml-0">
                                            <input type="time" formControlName="open" class="px-2 py-1 rounded border border-text-light/20 bg-surface-element text-text-light text-sm">
                                            <span class="text-text-light/40">-</span>
                                            <input type="time" formControlName="close" class="px-2 py-1 rounded border border-text-light/20 bg-surface-element text-text-light text-sm">
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
                            <div [formGroupName]="$index" class="flex items-center gap-2 animate-fade-in-up">
                                <select formControlName="icon" class="px-3 py-2 rounded-lg border border-text-light/20 bg-surface-element text-text-light text-sm max-w-[120px]">
                                    <option value="language">Web</option>
                                    <option value="instagram">Instagram</option>
                                    <option value="facebook">Facebook</option>
                                    <option value="twitter">Twitter</option>
                                    <option value="pinterest">Pinterest</option>
                                </select>
                                <input type="text" formControlName="name" placeholder="Nombre (ej. Instagram)" class="flex-1 px-3 py-2 rounded-lg border border-text-light/20 bg-surface-element text-text-light placeholder:text-text-light/60 text-sm w-0 min-w-[80px]">
                                <input type="text" formControlName="url" placeholder="URL (https://...)" class="flex-[2] px-3 py-2 rounded-lg border border-text-light/20 bg-surface-element text-text-light placeholder:text-text-light/60 text-sm w-0 min-w-[120px]">
                                <button type="button" (click)="removeSocialLink($index)" class="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                                    <span class="material-symbols-outlined text-lg">delete</span>
                                </button>
                            </div>
                        }
                    </div>
                </div>

            </div>

             <!-- Footer -->
            <div class="p-4 border-t border-text-light/10 flex justify-end gap-3 bg-surface-element">
                <button (click)="close()" 
                    class="px-4 py-2 rounded-lg text-sm font-medium text-text-light hover:bg-gray-200 transition-colors">
                    Cancelar
                </button>
                <button (click)="onSubmit()" 
                    [disabled]="form.invalid || isSaving()"
                    class="px-6 py-2 rounded-lg text-sm font-bold text-white bg-primary hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20 flex items-center gap-2">
                    @if (isSaving()) {
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
export class SidebarEditModal {
    isOpen = input<boolean>(false);
    initialData = input<any>(null);

    save = output<any>();
    closeModal = output<void>();

    fb = inject(FormBuilder);
    form: FormGroup;
    isSaving = signal(false);

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
            if (this.isOpen() && this.initialData()) {
                this.patchForm(this.initialData());
            }
        });
    }

    get socialLinksControls() {
        return this.form.get('socialLinks') as FormArray;
    }

    addSocialLink(data: SocialLink = { name: '', url: '', icon: 'language' }) {
        this.socialLinksControls.push(this.fb.group({
            name: [data.name, Validators.required],
            url: [data.url, Validators.required],
            icon: [data.icon]
        }));
    }

    removeSocialLink(index: number) {
        this.socialLinksControls.removeAt(index);
    }

    patchForm(data: any) {
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
    }

    onSubmit() {
        if (this.form.valid) {
            this.isSaving.set(true);
            const formValue = { ...this.form.value };

            if (formValue.businessHours) {
                Object.keys(formValue.businessHours).forEach(key => {
                    const day = formValue.businessHours[key];
                    if (day.isClosed) {
                        day.open = '00:00';
                        day.close = '00:00';
                    }
                });
            }

            this.save.emit(formValue);
        }
    }

    close() {
        this.closeModal.emit();
    }
}
