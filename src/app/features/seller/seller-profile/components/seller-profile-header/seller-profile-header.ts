import { Component, input, output } from '@angular/core';
import { EditTriggerButton } from '@shared/components/buttons/edit-trigger-button/edit-trigger-button';

@Component({
    selector: 'app-seller-profile-header',
    imports: [EditTriggerButton],
    templateUrl: './seller-profile-header.html',
    styleUrl: './seller-profile-header.css',
})
export class SellerProfileHeader {
    readonly avatarUrl = input<string>('');
    readonly sellerName = input<string>('');
    readonly description = input<string>('');
    readonly hasCoverImage = input<boolean>(false);

    readonly editAvatar = output<void>();
}
