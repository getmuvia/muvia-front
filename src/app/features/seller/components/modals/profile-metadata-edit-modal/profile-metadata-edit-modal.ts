import { TranslatePipe, UiTextPipe } from '@core/services/i18n/translation-pipes';
import { Component, ElementRef, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export interface ProfileMetadataFormData {
    businessName: string;
    description: string;
    offersRepairs: boolean;
    repairScope: string;
    repairDetails: string;
    repairsExternalProducts: boolean;
}

@Component({
    selector: 'app-profile-metadata-edit-modal',
    imports: [TranslatePipe, UiTextPipe, ReactiveFormsModule],
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
                    <div class="flex shrink-0 items-center justify-between border-b border-text-light/10 px-6 py-4">
                        <h3 id="profile-metadata-title" class="text-lg font-bold text-text-light">
                            {{ 'seller.editProfile' | translate }}
                        </h3>
                        <button
                            type="button"
                            class="rounded-full p-1 text-text-light/40 transition-colors hover:bg-surface-element hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
                            [attr.aria-label]="'common.close' | translate"
                            [disabled]="isLoading()"
                            (click)="close()"
                        >
                            <span class="material-symbols-outlined text-xl" aria-hidden="true">close</span>
                        </button>
                    </div>

                    <form class="flex min-h-0 flex-1 flex-col" [formGroup]="form" (input)="formChange.emit()" (ngSubmit)="onSubmit()">
                        <div class="flex min-h-0 flex-col gap-5 overflow-y-auto p-6">
                            @if (errorMessage()) {
                                <p class="rounded-control border border-error/20 bg-error/5 p-3 text-sm font-medium text-error"
                                    role="alert">
                                    {{ (errorMessage()) | uiText }}
                                </p>
                            }
                            @if (form.invalid && form.touched) {
                                <div class="rounded-control border border-error/20 bg-error/5 p-3" role="alert">
                                    <p class="text-sm font-bold text-error">{{ 'seller.reviewTheHighlightedFieldsBeforeSaving' | translate }}</p>
                                </div>
                            }
                            <div class="flex flex-col gap-2">
                                <label for="business-name" class="text-sm font-bold text-text-light">
                                    {{ 'seller.sellerName' | translate }}
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
                                        <span class="text-error">{{ 'seller.theSellerNameIsRequired' | translate }}</span>
                                    } @else if (businessName.touched && businessName.hasError('pattern')) {
                                        <span class="text-error">{{ 'seller.theNameCannotContainOnlySpaces' | translate }}</span>
                                    } @else if (businessName.touched && businessName.hasError('maxlength')) {
                                        <span class="text-error">{{ 'seller.theNameCannotExceed255Characters' | translate }}</span>
                                    }
                                </div>
                            </div>

                            <div class="flex flex-col gap-2">
                                <label for="seller-description" class="text-sm font-bold text-text-light">
                                    {{ 'common.description' | translate }}
                                </label>
                                <textarea
                                    id="seller-description"
                                    formControlName="description"
                                    rows="4"
                                    class="w-full resize-none rounded-control border border-text-light/20 bg-surface-element px-4 py-2 text-text-light focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    [placeholder]="'seller.brieflyDescribeYourBusiness' | translate"
                                ></textarea>
                                <p class="text-xs text-text-light/60">
                                    {{ 'seller.youCanLeaveItEmptyIfYouDoNot' | translate }}
                                </p>
                            </div>
                            <div class="border-t border-text-light/10 pt-5">
                                <label for="offers-repairs" class="flex cursor-pointer items-center justify-between gap-4 text-sm font-bold text-text-light">
                                    {{ 'seller.offerRepairServices' | translate }}
                                    <input id="offers-repairs" type="checkbox" role="switch" formControlName="offersRepairs"
                                        [attr.aria-checked]="form.controls.offersRepairs.value" class="size-5 shrink-0 accent-primary" />
                                </label>
                            </div>
                            @if (form.controls.offersRepairs.value) {
                                <div class="flex flex-col gap-2">
                                    <label for="repair-scope" class="text-sm font-bold text-text-light">{{ 'seller.repairScope' | translate }}</label>
                                    <input id="repair-scope" type="text" formControlName="repairScope" maxlength="160"
                                        [placeholder]="'seller.repairScopeExample' | translate"
                                        [attr.aria-invalid]="repairScope.invalid && repairScope.touched" aria-describedby="repair-scope-help"
                                        class="w-full rounded-control border border-text-light/20 bg-surface-element px-4 py-2 text-text-light focus:outline-none focus:ring-2 focus:ring-primary/50" />
                                    <p id="repair-scope-help" class="min-h-5 text-xs">
                                        @if (repairScope.touched && (repairScope.hasError('required') || repairScope.hasError('pattern'))) {
                                            <span class="text-error">{{ 'seller.repairScopeRequired' | translate }}</span>
                                        } @else if (repairScope.touched && repairScope.hasError('maxlength')) {
                                            <span class="text-error">{{ 'seller.repairScopeMaxLength' | translate }}</span>
                                        } @else {
                                            <span class="text-text-light/60">{{ 'seller.repairScopeHelp' | translate }}</span>
                                        }
                                    </p>
                                </div>
                                <div class="flex flex-col gap-2">
                                    <label for="repair-details" class="text-sm font-bold text-text-light">{{ 'seller.repairDetails' | translate }}</label>
                                    <textarea id="repair-details" rows="3" maxlength="500" formControlName="repairDetails"
                                        [attr.aria-invalid]="form.controls.repairDetails.invalid && form.controls.repairDetails.touched"
                                        aria-describedby="repair-details-help"
                                        class="w-full resize-none rounded-control border border-text-light/20 bg-surface-element px-4 py-2 text-text-light focus:outline-none focus:ring-2 focus:ring-primary/50"></textarea>
                                    <p id="repair-details-help" class="text-xs text-text-light/60">{{ 'seller.repairDetailsHelp' | translate }}</p>
                                </div>
                                <label for="external-repairs" class="flex cursor-pointer items-start gap-3 text-sm text-text-light">
                                    <input id="external-repairs" type="checkbox" formControlName="repairsExternalProducts" class="mt-0.5 size-5 shrink-0 accent-primary" />
                                    {{ 'seller.repairsExternalProductsLabel' | translate }}
                                </label>
                            }
                        </div>

                        <div class="flex shrink-0 justify-end gap-3 border-t border-text-light/10 bg-surface-element p-4">
                            <button
                                type="button"
                                class="rounded-control px-4 py-2 text-sm font-medium text-text-light transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
                                [disabled]="isLoading()"
                                (click)="close()"
                            >
                                {{ 'common.cancel' | translate }}
                            </button>
                            <button
                                type="submit"
                                class="flex items-center gap-2 rounded-control bg-primary px-6 py-2 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
                                [disabled]="form.pristine || isLoading()"
                            >
                                @if (isLoading()) {
                                    <span class="material-symbols-outlined animate-spin text-lg" aria-hidden="true">refresh</span>
                                } @else {
                                    <span class="material-symbols-outlined text-lg" aria-hidden="true">save</span>
                                }
                                {{ 'common.save' | translate }}
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
    readonly errorMessage = input<string | null>(null);

    readonly save = output<ProfileMetadataFormData>();
    readonly closeModal = output<void>();
    readonly formChange = output<void>();

    private readonly fb = inject(FormBuilder);
    private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
    readonly form = this.fb.nonNullable.group({
        businessName: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(255)]],
        description: [''],
        offersRepairs: [false],
        repairScope: [''],
        repairDetails: [''],
        repairsExternalProducts: [false],
    });

    readonly businessName = this.form.controls.businessName;
    readonly repairScope = this.form.controls.repairScope;

    constructor() {
        this.form.controls.offersRepairs.valueChanges.pipe(takeUntilDestroyed()).subscribe(enabled => {
            this.repairScope.setValidators(enabled
                ? [Validators.required, Validators.pattern(/\S/), Validators.maxLength(160)] : []);
            this.form.controls.repairDetails.setValidators(enabled ? [Validators.maxLength(500)] : []);
            this.repairScope.updateValueAndValidity({ emitEvent: false });
            this.form.controls.repairDetails.updateValueAndValidity({ emitEvent: false });
        });
        effect(() => {
            const data = this.initialData();
            if (!this.isOpen() || !data) return;

            this.form.setValue({
                businessName: data.businessName,
                description: data.description,
                offersRepairs: data.offersRepairs ?? false,
                repairScope: data.repairScope ?? '',
                repairDetails: data.repairDetails ?? '',
                repairsExternalProducts: data.repairsExternalProducts ?? false,
            });
            this.form.markAsPristine();
            this.form.markAsUntouched();
        });
    }

    onSubmit(): void {
        this.form.markAllAsTouched();
        if (this.form.invalid || this.isLoading()) {
            queueMicrotask(() => {
                this.host.nativeElement.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
            });
            return;
        }

        const value = this.form.getRawValue();
        this.save.emit({
            businessName: value.businessName.trim(),
            description: value.description.trim(),
            offersRepairs: value.offersRepairs,
            repairScope: value.offersRepairs ? value.repairScope.trim() : '',
            repairDetails: value.offersRepairs ? value.repairDetails.trim() : '',
            repairsExternalProducts: value.offersRepairs && value.repairsExternalProducts,
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
