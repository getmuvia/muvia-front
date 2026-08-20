import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { Product } from '@core/models/product/product';
import { ProductCard } from '@shared/components/product-card/product-card';

import { Skeleton } from '@shared/components/loaders/skeleton/skeleton';
import { EmptyState } from '@shared/components/empty-state/empty-state';

@Component({
    selector: 'app-product-grid',
    imports: [ProductCard, Skeleton, EmptyState],
    templateUrl: './product-grid.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    styleUrl: './product-grid.css',
})
export class ProductGrid {
    readonly products = input<Product[]>([]);
    readonly isLoading = input<boolean>(false);
    readonly viewMode = input<'grid' | 'list'>('grid');
}
