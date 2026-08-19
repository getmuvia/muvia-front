import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { Product } from '@core/models/product/product';
import { ProductCard } from '@shared/components/product-card/product-card';

import { Skeleton } from '@shared/components/loaders/skeleton/skeleton';
import { EmptyState } from '@shared/components/empty-state/empty-state';

@Component({
    selector: 'app-product-grid',
    imports: [ProductCard, Skeleton, EmptyState],
    templateUrl: './product-grid.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './product-grid.css',
})
export class ProductGrid {
    products = input<Product[]>([]);
    isLoading = input<boolean>(false);
    viewMode = input<'grid' | 'list'>('grid');
}
