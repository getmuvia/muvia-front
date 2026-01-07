import { Component, input } from '@angular/core';
import { Product } from '@core/models/product/product';
import { ProductCard } from '@shared/components/product-card/product-card';

@Component({
    selector: 'app-similar-products',
    imports: [ProductCard],
    templateUrl: './similar-products.html',
    styleUrl: './similar-products.css',
})
export class SimilarProducts {
    products = input<Product[]>([]);
}
