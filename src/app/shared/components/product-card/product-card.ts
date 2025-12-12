import { Component, input } from '@angular/core';
import { Product } from '../../../core/models/product/product';
import { CommonModule, CurrencyPipe, NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-product-card',
  imports: [CommonModule, CurrencyPipe, NgOptimizedImage],
  templateUrl: './product-card.html',
  styleUrl: './product-card.css',
})
export class ProductCard {

  product = input.required<Product>();
}
