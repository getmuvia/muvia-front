import { Component, input } from '@angular/core';
import type { VendorProfile } from '@core/models/user/vendor-profile';
import { TranslatePipe } from '@core/services/i18n/translation-pipes';

@Component({
  selector: 'app-vendor-repair-badge',
  imports: [TranslatePipe],
  template: `
    @if (profile()?.offersRepairs && profile()?.repairScope) {
      <details class="group w-full" data-repair-badge>
        <summary
          class="flex cursor-pointer list-none flex-col items-end rounded-none text-right focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink [&::-webkit-details-marker]:hidden"
        >
          <span
            class="inline-flex min-h-11 items-center gap-1.5 rounded-none border border-line bg-mist px-3 py-2 text-sm font-semibold text-ink"
          >
            <span class="material-symbols-outlined icon-md" aria-hidden="true">build</span>
            <span class="whitespace-nowrap">{{ 'seller.offersRepairs' | translate }}</span>
            <span
              class="material-symbols-outlined icon-md transition-transform group-open:rotate-180"
              aria-hidden="true"
              >expand_more</span
            >
          </span>
          <span class="mt-2 block break-words text-sm text-ink">{{
            profile()?.repairScope
          }}</span>
        </summary>
        <div
          class="mt-3 space-y-2 rounded-none border border-line bg-mist p-4 text-sm text-ink"
        >
          @if (profile()?.repairDetails) {
            <p class="whitespace-pre-line break-words type-body">{{ profile()?.repairDetails }}</p>
          }
          <p class="type-body">
            {{
              (profile()?.repairsExternalProducts
                ? 'seller.externalRepairsAccepted'
                : 'seller.externalRepairsNotAccepted'
              ) | translate
            }}
          </p>
        </div>
      </details>
    }
  `,
})
export class VendorRepairBadge {
  readonly profile = input<Pick<
    VendorProfile,
    'offersRepairs' | 'repairScope' | 'repairDetails' | 'repairsExternalProducts'
  > | null>(null);
}
