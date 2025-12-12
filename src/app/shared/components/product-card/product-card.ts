import { Component, input } from '@angular/core';
import { Product } from '../../../core/models/product/product';

@Component({
  selector: 'app-product-card',
  imports: [],
  templateUrl: './product-card.html',
  styleUrl: './product-card.css',
})
export class ProductCard {

  product = input.required<Product>();
}
