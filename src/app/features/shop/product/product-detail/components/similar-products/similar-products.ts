import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { Product } from '@core/models/product/product';
import { ProductCard } from '@shared/components/product-card/product-card';

@Component({
    selector: 'app-similar-products',
    imports: [ProductCard],
    templateUrl: './similar-products.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    styleUrl: './similar-products.css',
})
export class SimilarProducts {
    readonly products = input<Product[]>([]);
}
