import { Component, input, output } from '@angular/core';
import { EditTriggerButton } from '@shared/components/buttons/edit-trigger-button/edit-trigger-button';


export interface SellerSocialLink {
    name: string;
    url: string;
    icon: 'language' | 'instagram' | 'pinterest';
}

@Component({
    selector: 'app-seller-sidebar',
    imports: [EditTriggerButton],
    templateUrl: './seller-sidebar.html',
    styleUrl: './seller-sidebar.css',
})
export class SellerSidebar {
    aboutText = input<string>('');
    businessHours = input<any>({});
    socialLinks = input<SellerSocialLink[]>([]);

    editInfo = output<void>();

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
