import { Component, input, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'app-empty-state',
    standalone: true,
    imports: [],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `
    <div class="flex flex-col items-center justify-center rounded-3xl border border-border-color bg-surface-light/70 px-6 py-20 text-center">
        <span class="material-symbols-outlined mb-5 flex size-16 items-center justify-center rounded-full bg-white text-xl text-primary/50 shadow-sm">{{ icon() }}</span>
        <h3 class="text-xl font-semibold text-text-light font-headline mb-2">{{ title() }}</h3>
        <p class="text-text-secondary font-body text-center max-w-md">
            {{ description() }}
        </p>
        <ng-content select="button"></ng-content>
    </div>
  `
})
export class EmptyState {
    icon = input<string>('inventory_2');
    title = input<string>('No hay datos');
    description = input<string>('No se encontraron resultados para mostrar.');
}
