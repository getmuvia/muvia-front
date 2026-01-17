import { Component, input, output } from '@angular/core';

@Component({
    selector: 'app-seller-profile-header',
    imports: [],
    templateUrl: './seller-profile-header.html',
    styleUrl: './seller-profile-header.css',
})
export class SellerProfileHeader {
    avatarUrl = input<string>('');
    sellerName = input<string>('');
    description = input<string>('');
    hasCoverImage = input<boolean>(false);

    follow = output<void>();
    contact = output<void>();

    onFollow(): void {
        this.follow.emit();
    }

    onContact(): void {
        this.contact.emit();
    }
}
