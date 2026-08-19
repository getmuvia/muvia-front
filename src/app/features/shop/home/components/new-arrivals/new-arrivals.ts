import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { ProductCard } from '@shared/components/product-card/product-card';
import { Product } from '@core/models/product/product';

@Component({
  selector: 'app-new-arrivals',
  imports: [ProductCard],
  templateUrl: './new-arrivals.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './new-arrivals.css',
})
export class NewArrivals {
  // Products - will be loaded from service
  products = signal<Product[]>([]);
}
