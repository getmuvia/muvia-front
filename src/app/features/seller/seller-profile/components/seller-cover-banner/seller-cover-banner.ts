import { Component, input, output } from '@angular/core';

@Component({
    selector: 'app-seller-cover-banner',
    imports: [],
    templateUrl: './seller-cover-banner.html',
    styleUrl: './seller-cover-banner.css',
})
export class SellerCoverBanner {
    coverImageUrl = input<string>('');
    edit = output<void>();
}
