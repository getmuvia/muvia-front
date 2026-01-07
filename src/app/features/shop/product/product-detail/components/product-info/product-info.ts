import { Component, input, output } from '@angular/core';
import { Product } from '@core/models/product/product';
import { CurrencyPipe } from '@angular/common';

@Component({
    selector: 'app-product-info',
    imports: [CurrencyPipe],
    templateUrl: './product-info.html',
    styleUrl: './product-info.css',
})
export class ProductInfo {
    product = input.required<Product>();

    contactSeller = output<void>();

    get priceNumber(): number {
        return parseFloat(this.product().price) || 0;
    }

    onContactSeller(): void {
        this.contactSeller.emit();
    }
}
