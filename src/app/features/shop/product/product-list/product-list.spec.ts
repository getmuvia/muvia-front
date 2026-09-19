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

  it('renders fallback products in a separately labeled section', () => {
    component.useSmartSearch.set(true);
    component.relatedProducts.set([{
      id: 'fallback-chair',
      sellerId: '',
      categoryId: '',
      title: 'Silla ergonómica',
      description: '',
      price: '1500',
      stock: 0,
      specifications: {},
      keywords: [],
      createdAt: '',
      assets: [],
      category: {
        id: '',
        parentId: null,
        name: '',
        description: '',
        imageUrl: '',
        level: 0,
      },
      score: 0.4,
      matchType: 'lexical',
    }]);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'Otros productos que te podrían interesar',
    );
    expect(fixture.nativeElement.textContent).toContain('Silla ergonómica');
  });
});
