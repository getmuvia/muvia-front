import { Component, signal } from '@angular/core';
import { ProductCard } from '@shared/components/product-card/product-card';
import { Product } from '@core/models/product/product';

@Component({
  selector: 'app-new-arrivals',
  imports: [ProductCard],
  templateUrl: './new-arrivals.html',
  styleUrl: './new-arrivals.css',
})
export class NewArrivals {
  products = signal<Product[]>([
    {
      id: '1',
      brand: 'Marca A',
      name: 'Jarrón de Cerámica Blanca',
      price: 45.00,
      imageUrl: 'assets/images/products/vase-white.jpg',
      altText: 'Jarrón minimalista con rama seca'
    },
    {
      id: '2',
      brand: 'Marca B',
      name: 'Lámpara de Mesa "Elegance"',
      price: 120.00,
      imageUrl: 'assets/images/products/lamp-brass.jpg',
      altText: 'Lámpara de mesa con base de latón'
    },
    {
      id: '3',
      brand: 'Marca C',
      name: 'Cojín de Lino Texturizado',
      price: 55.00,
      imageUrl: 'assets/images/products/cushion-beige.jpg',
      altText: 'Cojín beige sobre sofá moderno'
    },
    {
      id: '4',
      brand: 'Marca D',
      name: 'Taburete de Madera Rústico',
      price: 89.00,
      imageUrl: 'assets/images/products/stool-wood.jpg',
      altText: 'Taburete pequeño de madera'
    }
  ]);
}
