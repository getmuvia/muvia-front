import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { I18nService, Language } from '@core/services/i18n/i18n';
import { TranslatePipe } from '@core/services/i18n/translation-pipes';

@Component({
  selector: 'app-language-selector',
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <label
      class="text-ink"
      [class]="
        variant() === 'full'
          ? 'inline-flex items-center'
          : 'inline-flex h-10 items-center gap-1 rounded-control border border-line px-2'
      "
      [title]="(i18n.language() === 'es' ? 'common.spanish' : 'common.english') | translate"
    >
      @if (variant() === 'compact') {
        <svg
          class="size-4 shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="9" />
          <ellipse cx="12" cy="12" rx="4" ry="9" />
          <path d="M3 12h18M5 6.5h14M5 17.5h14" />
        </svg>
      }
      <span class="sr-only">{{ 'common.language' | translate }}</span>
      <select
        class="type-control"
        [value]="i18n.language()"
        (change)="changeLanguage($event)"
        [attr.aria-label]="'common.language' | translate"
        [class]="
          variant() === 'full'
            ? 'min-h-11 cursor-pointer bg-transparent py-2 font-medium focus-visible:outline-2 focus-visible:outline-offset-2'
            : 'cursor-pointer bg-transparent py-2 font-semibold uppercase focus-visible:outline-2 focus-visible:outline-offset-2'
        "
      >
        <option value="es" lang="es" [title]="'common.spanish' | translate" class="text-ink">
          {{ variant() === 'full' ? ('common.spanish' | translate) : 'ES' }}
        </option>
        <option value="en" lang="en" [title]="'common.english' | translate" class="text-ink">
          {{ variant() === 'full' ? ('common.english' | translate) : 'EN' }}
        </option>
      </select>
    </label>
  `,
})
export class LanguageSelector {
  readonly i18n = inject(I18nService);
  readonly variant = input<'compact' | 'full'>('compact');

  changeLanguage(event: Event): void {
    this.i18n.selectLanguage((event.target as HTMLSelectElement).value as Language);
  }
}
