import { Component, input } from '@angular/core';
import type { VendorProfile } from '@core/models/user/vendor-profile';
import { TranslatePipe } from '@core/services/i18n/translation-pipes';

@Component({
    selector: 'app-vendor-repair-badge',
    imports: [TranslatePipe],
    template: `
        @if (profile()?.offersRepairs && profile()?.repairScope) {
            <details class="group w-full" data-repair-badge>
                <summary class="flex cursor-pointer list-none flex-col items-end rounded-none text-right focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary [&::-webkit-details-marker]:hidden">
                    <span class="inline-flex min-h-11 items-center gap-1.5 rounded-none border border-primary/20 bg-primary/5 px-3 py-2 text-sm font-semibold text-primary">
                        <span class="material-symbols-outlined text-lg" aria-hidden="true">build</span>
                        <span class="whitespace-nowrap">{{ 'seller.offersRepairs' | translate }}</span>
                        <span class="material-symbols-outlined text-lg transition-transform group-open:rotate-180" aria-hidden="true">expand_more</span>
                    </span>
                    <span class="mt-2 block break-words text-sm text-text-light/70">{{ profile()?.repairScope }}</span>
                </summary>
                <div class="mt-3 space-y-2 rounded-none border border-primary/15 bg-primary/5 p-4 text-sm text-text-light/80">
                    @if (profile()?.repairDetails) {
                        <p class="whitespace-pre-line break-words">{{ profile()?.repairDetails }}</p>
                    }
                    <p>{{ (profile()?.repairsExternalProducts ? 'seller.externalRepairsAccepted' : 'seller.externalRepairsNotAccepted') | translate }}</p>
                </div>
            </details>
        }
    `,
})
export class VendorRepairBadge {
    readonly profile = input<Pick<VendorProfile,
        'offersRepairs' | 'repairScope' | 'repairDetails' | 'repairsExternalProducts'> | null>(null);
}
