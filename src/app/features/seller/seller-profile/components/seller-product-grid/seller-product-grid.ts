import { TranslatePipe } from '@core/services/i18n/translation-pipes';
import { Component, input } from '@angular/core';
import type { ProductPreview } from '@core/models/product/product-summary';
import { ProductCard } from '@shared/components/product-card/product-card';

@Component({
    selector: 'app-seller-product-grid',
    imports: [TranslatePipe, ProductCard],
    templateUrl: './seller-product-grid.html',
    styleUrl: './seller-product-grid.css',
})
export class SellerProductGrid {
    readonly products = input<ProductPreview[]>([]);
    readonly editable = input(true);
}
