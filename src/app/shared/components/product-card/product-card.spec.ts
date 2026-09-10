import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Product } from '@core/models/product/product';
import { ProductCard } from './product-card';

describe('ProductCard', () => {
  let component: ProductCard;
  let fixture: ComponentFixture<ProductCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductCard);
    const product: Product = {
      id: 'product-id',
      sellerId: 'seller-id',
      categoryId: 'category-id',
      title: 'Producto de prueba',
      description: 'Descripción de prueba',
      price: '100',
      stock: 1,
      specifications: {},
      keywords: [],
      createdAt: '2026-09-10T00:00:00.000Z',
      assets: [],
      category: {
        id: 'category-id',
        parentId: null,
        name: 'Categoría de prueba',
        description: '',
        imageUrl: '',
        level: 0,
      },
    };
    fixture.componentRef.setInput('product', product);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
