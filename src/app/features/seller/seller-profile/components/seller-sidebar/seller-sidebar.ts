import { Component, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';

export interface SellerSocialLink {
    name: string;
    url: string;
    icon: 'language' | 'instagram' | 'pinterest';
}

@Component({
    selector: 'app-seller-sidebar',
    imports: [DecimalPipe],
    templateUrl: './seller-sidebar.html',
    styleUrl: './seller-sidebar.css',
})
export class SellerSidebar {
    aboutText = input<string>('');
    rating = input<number>(0);
    totalReviews = input<number>(0);
    socialLinks = input<SellerSocialLink[]>([]);
}
