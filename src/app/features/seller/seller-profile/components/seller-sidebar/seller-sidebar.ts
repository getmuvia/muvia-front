import { TranslatePipe, UiTextPipe } from '@core/services/i18n/translation-pipes';
import { Component, computed, input, output } from '@angular/core';
import { EditTriggerButton } from '@shared/components/buttons/edit-trigger-button/edit-trigger-button';
import { BusinessHours, SocialLink } from '@core/models/user/vendor-profile';

@Component({
    selector: 'app-seller-sidebar',
    imports: [TranslatePipe, UiTextPipe, EditTriggerButton],
    templateUrl: './seller-sidebar.html',
    styleUrl: './seller-sidebar.css',
})
export class SellerSidebar {
    readonly aboutText = input('');
    readonly businessHours = input<BusinessHours>({});
    readonly socialLinks = input<SocialLink[]>([]);
    readonly editable = input(true);
    readonly hasBusinessHours = computed(() => Object.keys(this.businessHours()).length > 0);

    readonly editInfo = output<void>();

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
