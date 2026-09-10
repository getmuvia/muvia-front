import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { ProductStore } from '@core/services/product/product.store';
import { ProductDetail } from './product-detail';

describe('ProductDetail', () => {
  let component: ProductDetail;
  let fixture: ComponentFixture<ProductDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductDetail]
    })
    .overrideComponent(ProductDetail, {
      set: {
        providers: [{
          provide: ProductStore,
          useValue: {
            selectedEntity: signal(null).asReadonly(),
            isLoading: signal(false).asReadonly(),
            error: signal(null).asReadonly(),
            getProductById: () => undefined,
            getAllProducts: () => of({
              data: [],
              total: 0,
              page: 1,
              limit: 20,
              totalPages: 0,
            }),
          },
        }]
      }
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductDetail);
    fixture.componentRef.setInput('id', 'product-id');
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
