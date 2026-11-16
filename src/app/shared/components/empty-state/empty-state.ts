import { UiTextPipe } from '@core/services/i18n/translation-pipes';
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [UiTextPipe],
  template: `
    <div
      class="flex flex-col items-center justify-center rounded-panel border border-border-color bg-surface-light/70 px-6 py-20 text-center"
    >
      <span
        class="material-symbols-outlined mb-5 flex size-16 items-center justify-center rounded-full bg-white icon-lg text-primary/50 shadow-sm"
        >{{ icon() }}</span
      >
      <h3 class="text-text-light mb-2 type-card-title">{{ title() | uiText }}</h3>
      <p class="text-text-secondary font-body text-center max-w-md type-body">
        {{ description() | uiText }}
      </p>
      <ng-content select="button"></ng-content>
    </div>
  `,
})
export class EmptyState {
  readonly icon = input<string>('inventory_2');
  readonly title = input<string>('No hay datos');
  readonly description = input<string>('No se encontraron resultados para mostrar.');
}
