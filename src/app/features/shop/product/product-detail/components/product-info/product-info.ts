import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { Product } from '@core/models/product/product';
import { CurrencyPipe } from '@angular/common';

@Component({
    selector: 'app-product-info',
    imports: [CurrencyPipe],
    templateUrl: './product-info.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    styleUrl: './product-info.css',
})
export class ProductInfo {
    readonly product = input.required<Product>();

    readonly contactSeller = output<void>();

    get priceNumber(): number {
        return parseFloat(this.product().price) || 0;
    }

    onContactSeller(): void {
        this.contactSeller.emit();
    }
}
