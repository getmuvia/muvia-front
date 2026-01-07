import { Component, input } from '@angular/core';
import { Product } from '@core/models/product/product';
import { ProductCard } from '@shared/components/product-card/product-card';

@Component({
    selector: 'app-product-grid',
    imports: [ProductCard],
    templateUrl: './product-grid.html',
    styleUrl: './product-grid.css',
})
export class ProductGrid {
    products = input<Product[]>([]);
    isLoading = input<boolean>(false);
    viewMode = input<'grid' | 'list'>('grid');
}
