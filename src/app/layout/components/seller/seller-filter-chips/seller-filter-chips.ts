import { Component, input, output } from '@angular/core';

export interface FilterChip {
    id: string;
    label: string;
    hasDropdown?: boolean;
}

@Component({
    selector: 'app-seller-filter-chips',
    imports: [],
    templateUrl: './seller-filter-chips.html',
    styleUrl: './seller-filter-chips.css',
})
export class SellerFilterChips {
    chips = input<FilterChip[]>([
        { id: 'all', label: 'Todos' },
        { id: 'price', label: 'Precio: Bajo a Alto', hasDropdown: true },
        { id: 'popularity', label: 'Popularidad', hasDropdown: true },
        { id: 'newest', label: 'Novedades', hasDropdown: true },
    ]);
    activeChipId = input<string>('all');

    chipSelected = output<string>();

    onChipClick(chipId: string): void {
        this.chipSelected.emit(chipId);
    }
}
