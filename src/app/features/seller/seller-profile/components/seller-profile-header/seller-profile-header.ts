import { TranslatePipe } from '@core/services/i18n/translation-pipes';
import { Component, input, output } from '@angular/core';
import { EditTriggerButton } from '@shared/components/buttons/edit-trigger-button/edit-trigger-button';
import type { VendorProfile } from '@core/models/user/vendor-profile';
import { VendorRepairBadge } from '@shared/components/vendor-repair-badge/vendor-repair-badge';

@Component({
    selector: 'app-seller-profile-header',
    imports: [TranslatePipe, EditTriggerButton, VendorRepairBadge],
    templateUrl: './seller-profile-header.html',
    styleUrl: './seller-profile-header.css',
})
export class SellerProfileHeader {
    readonly avatarUrl = input<string>('');
    readonly sellerName = input<string>('');
    readonly description = input<string>('');
    readonly hasCoverImage = input<boolean>(false);
    readonly repairSettings = input<VendorProfile | null>(null);
    readonly editable = input(true);

    readonly editAvatar = output<void>();
    readonly editProfile = output<void>();
}
