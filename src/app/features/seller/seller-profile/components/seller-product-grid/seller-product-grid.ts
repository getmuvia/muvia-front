import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { Product } from '@core/models/product/product';
import { ProductCard } from '@shared/components/product-card/product-card';

@Component({
    selector: 'app-seller-product-grid',
    imports: [ProductCard],
    templateUrl: './seller-product-grid.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    styleUrl: './seller-product-grid.css',
})
export class SellerProductGrid {
    readonly products = input<Product[]>([]);
}
