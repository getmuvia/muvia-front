import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductStore } from '@core/services/product/product.store';
import { ProductList } from './product-list';

describe('ProductList', () => {
  let component: ProductList;
  let fixture: ComponentFixture<ProductList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductList]
    })
    .overrideComponent(ProductList, {
      set: {
        providers: [{
          provide: ProductStore,
          useValue: {
            products: signal([]).asReadonly(),
            isLoading: signal(false).asReadonly(),
            isError: signal(false).asReadonly(),
            hasNextPage: signal(false).asReadonly(),
            page: signal(1).asReadonly(),
            searchProducts: () => undefined,
          },
        }]
      }
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
