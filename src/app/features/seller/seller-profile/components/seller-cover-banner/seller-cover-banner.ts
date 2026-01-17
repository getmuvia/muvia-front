import { Component, input, output, effect } from '@angular/core';

@Component({
    selector: 'app-seller-cover-banner',
    imports: [],
    templateUrl: './seller-cover-banner.html',
    styleUrl: './seller-cover-banner.css',
    host: {
        class: 'block w-full'
    }
})
export class SellerCoverBanner {
    coverImageUrl = input<string>('');
    edit = output<void>();

    constructor() {
        effect(() => {
            console.log('SellerCoverBanner received url:', this.coverImageUrl());
        });
    }
}
