import { Component, input, output } from '@angular/core';
import { EditTriggerButton } from '@shared/components/buttons/edit-trigger-button/edit-trigger-button';
import { SocialLink } from '@core/models/user/vendor-profile';

@Component({
    selector: 'app-seller-sidebar',
    imports: [EditTriggerButton],
    templateUrl: './seller-sidebar.html',
    styleUrl: './seller-sidebar.css',
})
export class SellerSidebar {
    aboutText = input<string>('');
    businessHours = input<any>({});
    socialLinks = input<SocialLink[]>([]);

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
