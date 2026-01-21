import { Component, input } from '@angular/core';

@Component({
    selector: 'app-empty-state',
    standalone: true,
    imports: [],
    template: `
    <div class="flex flex-col items-center justify-center py-24 text-center">
        <span class="material-symbols-outlined text-6xl text-text-light/20 mb-4">{{ icon() }}</span>
        <h3 class="text-xl font-bold text-text-light font-body mb-2">{{ title() }}</h3>
        <p class="text-text-light/60 font-body text-center max-w-md">
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
