import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { EditTriggerButton } from '@shared/components/buttons/edit-trigger-button/edit-trigger-button';

@Component({
    selector: 'app-seller-profile-header',
    imports: [EditTriggerButton],
    templateUrl: './seller-profile-header.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './seller-profile-header.css',
})
export class SellerProfileHeader {
    avatarUrl = input<string>('');
    sellerName = input<string>('');
    description = input<string>('');
    hasCoverImage = input<boolean>(false);

    editAvatar = output<void>();
    follow = output<void>();
    contact = output<void>();

    onFollow(): void {
        this.follow.emit();
    }

    onContact(): void {
        this.contact.emit();
    }
}
