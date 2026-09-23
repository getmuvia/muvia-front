import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { throwError } from 'rxjs';

import { ProductService } from './product';
import { ProductStore } from './product.store';

describe('ProductStore error identity', () => {
  let store: InstanceType<typeof ProductStore>;
  let updateProduct: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    updateProduct = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        ProductStore,
        {
          provide: ProductService,
          useValue: { updateProduct },
        },
      ],
    });

    store = TestBed.inject(ProductStore);
  });

  it('preserves normalized metadata when a product update fails', () => {
    updateProduct.mockReturnValue(throwError(() => new HttpErrorResponse({
      status: 409,
      error: {
        code: 'PRODUCT_LIMIT_REACHED',
        message: 'Internal product limit details',
        correlationId: 'request-id',
      },
    })));
    const onError = vi.fn();

    store.updateProduct({
      id: 'product-id',
      dto: { title: 'Updated product' },
      onError,
    });

    expect(store.error()).toEqual({
      kind: 'conflict',
      message: 'Alcanzaste el límite de productos permitidos.',
      status: 409,
      code: 'PRODUCT_LIMIT_REACHED',
      retryable: false,
      correlationId: 'request-id',
    });
    expect(onError).toHaveBeenCalledWith(store.error());
  });
});
