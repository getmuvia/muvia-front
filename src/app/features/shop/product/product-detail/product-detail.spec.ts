import { signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { ProductStore } from '@core/services/product/product.store';
import { ProductDetail } from './product-detail';

describe('ProductDetail', () => {
  let component: ProductDetail;
  let fixture: ComponentFixture<ProductDetail>;
  let getProductById: ReturnType<typeof vi.fn>;
  let errorState: WritableSignal<string | null>;

  beforeEach(async () => {
    getProductById = vi.fn();
    errorState = signal<string | null>(null);

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
            error: errorState.asReadonly(),
            getProductById,
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

  it('allows retrying the current product after an error', () => {
    getProductById.mockClear();
    errorState.set('No pudimos cargar el producto.');
    fixture.detectChanges();

    component.retryProduct();

    expect(getProductById).toHaveBeenCalledWith('product-id');
    expect(fixture.nativeElement.textContent).toContain('Reintentar');
  });
});
