import { Component, input } from '@angular/core';


export interface SellerSocialLink {
    name: string;
    url: string;
    icon: 'language' | 'instagram' | 'pinterest';
}

@Component({
    selector: 'app-seller-sidebar',
    imports: [],
    templateUrl: './seller-sidebar.html',
    styleUrl: './seller-sidebar.css',
})
export class SellerSidebar {
    aboutText = input<string>('');
    businessHours = input<any>({}); // Using any temporarily, ideally BusinessHours
    socialLinks = input<SellerSocialLink[]>([]);

    weekDays = [
        { key: 'monday', label: 'Lunes' },
        { key: 'tuesday', label: 'Martes' },
        { key: 'wednesday', label: 'Miércoles' },
        { key: 'thursday', label: 'Jueves' },
        { key: 'friday', label: 'Viernes' },
        { key: 'saturday', label: 'Sábado' },
        { key: 'sunday', label: 'Domingo' }
    ];
}
