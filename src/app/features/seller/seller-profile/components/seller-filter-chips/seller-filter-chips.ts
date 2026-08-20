import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';

export interface FilterChip {
    id: string;
    label: string;
    hasDropdown?: boolean;
}

@Component({
    selector: 'app-seller-filter-chips',
    imports: [],
    templateUrl: './seller-filter-chips.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    styleUrl: './seller-filter-chips.css',
})
export class SellerFilterChips {
    readonly chips = input<FilterChip[]>([
        { id: 'all', label: 'Todos' },
        { id: 'price', label: 'Precio: Bajo a Alto', hasDropdown: true },
        { id: 'popularity', label: 'Popularidad', hasDropdown: true },
        { id: 'newest', label: 'Novedades', hasDropdown: true },
    ]);
    readonly activeChipId = input<string>('all');

    readonly chipSelected = output<string>();

    onChipClick(chipId: string): void {
        this.chipSelected.emit(chipId);
    }
}
