import { signal, type WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';

import type { Product } from '@core/models/product/product';
import { ProductStore } from '@core/services/product/product.store';
import type { AppError } from '@core/models/errors/api-error.model';
import { ProductDetail } from './product-detail';
import { MarketService } from '@core/services/market/market';
import { I18nService } from '@core/services/i18n/i18n';
import { productFixture } from './testing/product-fixture';

describe('ProductDetail', () => {
  let component: ProductDetail;
  let fixture: ComponentFixture<ProductDetail>;
  let getProductById: ReturnType<typeof vi.fn>;
  let getAllProducts: ReturnType<typeof vi.fn>;
  let errorState: WritableSignal<AppError | null>;
  let selectedProduct: WritableSignal<Product | null>;

  beforeEach(async () => {
    getProductById = vi.fn();
    getAllProducts = vi.fn().mockReturnValue(
      of({
        data: [],
        total: 0,
        page: 1,
        limit: 5,
        totalPages: 0,
      }),
    );
    errorState = signal<AppError | null>(null);
    selectedProduct = signal<Product | null>(null);

    await TestBed.configureTestingModule({
      imports: [ProductDetail],
      providers: [
        {
          provide: MarketService,
          useValue: { selectedMarket: signal({ code: 'BO' }), locale: signal('es-BO') },
        },
      ],
    })
      .overrideComponent(ProductDetail, {
        set: {
          providers: [
            {
              provide: ProductStore,
              useValue: {
                selectedEntity: selectedProduct.asReadonly(),
                isLoading: signal(false).asReadonly(),
                error: errorState.asReadonly(),
                getProductById,
                getAllProducts,
              },
            },
          ],
        },
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
    errorState.set({
      kind: 'network',
      message: 'No pudimos cargar el producto.',
      status: 0,
      code: null,
      retryable: true,
      correlationId: null,
    });
    fixture.detectChanges();

    component.retryProduct();

    expect(getProductById).toHaveBeenCalledWith('product-id');
    expect(fixture.nativeElement.textContent).toContain('Reintentar');
  });

  it('loads a bounded category page and clears stale recommendations on failure', () => {
    const relatedProduct = { id: 'related-id', categoryId: 'category-id' } as Product;
    getAllProducts.mockReturnValueOnce(
      of({
        data: [relatedProduct],
        total: 1,
        page: 1,
        limit: 5,
        totalPages: 1,
      }),
    );

    component.loadSimilarProducts('category-id', 'product-id');

    expect(getAllProducts).toHaveBeenCalledWith({
      page: 1,
      limit: 5,
      search: '',
      categoryId: 'category-id',
    });
    expect(component.similarProducts()).toEqual([relatedProduct]);

    getAllProducts.mockReturnValueOnce(throwError(() => new Error('catalog unavailable')));
    component.loadSimilarProducts('next-category-id', 'next-id');

    expect(component.similarProducts()).toEqual([]);
  });

  it('connects the complete published product view to the selected API product', async () => {
    selectedProduct.set(productFixture());
    await fixture.whenStable();
    const page = fixture.nativeElement as HTMLElement;
    expect(page.querySelector('h1')?.textContent).toBe('Escritorio del vendedor');
    expect(page.querySelector('.gallery-image img')?.getAttribute('src')).toBe(
      'https://example.test/primary.webp',
    );
    expect(page.querySelector('[data-price-dimensions]')?.textContent).toContain(
      '140 × 60 × 75 cm',
    );
    expect(page.textContent).toContain('Descripción original del vendedor.');
    expect(page.querySelector('a[href="/stores/seller"]')).not.toBeNull();
    expect(page.querySelector('a[href^="mailto:"]')).not.toBeNull();
    expect(page.querySelector('input')).toBeNull();
    expect(page.textContent).not.toContain('Por pedido');
    expect(page.textContent).not.toContain('Solicitar cotización');
    const panel = page.querySelector<HTMLDialogElement>('#product-technical-details')!;
    panel.showModal = vi.fn();
    page.querySelector<HTMLButtonElement>('[aria-controls="product-technical-details"]')!.click();
    expect(panel.showModal).toHaveBeenCalledOnce();
    expect(panel.textContent).toContain('140 cm');
    expect(panel.textContent).toContain('60 cm');
    expect(panel.textContent).toContain('Roble macizo');
    expect(panel.querySelector('svg')).toBeNull();
  });

  it('offers personalization only for enabled products with valid published dimensions', async () => {
    const action = '[aria-controls="dimension-studio"]';
    const page = fixture.nativeElement as HTMLElement;

    selectedProduct.set(productFixture({ acceptsCustomDimensions: true, specifications: null }));
    await fixture.whenStable();
    expect(page.querySelector(action)).toBeNull();
    expect(page.textContent).not.toContain('Medidas personalizables');

    selectedProduct.set(productFixture({ acceptsCustomDimensions: true }));
    await fixture.whenStable();
    expect(page.querySelector(action)?.textContent).toContain('Personalizar medidas');
    expect(page.textContent).toContain('Medidas personalizables');
    expect(page.querySelector('a[href^="mailto:"]')).toBeNull();
  });

  it('copies the selected product link and translates share feedback', async () => {
    localStorage.removeItem('muvia.language');
    const i18n = TestBed.inject(I18nService);
    i18n.selectLanguage('es');
    selectedProduct.set(productFixture());
    await fixture.whenStable();
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    try {
      await component.shareProduct();
      fixture.detectChanges();
      expect(writeText).toHaveBeenCalledWith('https://app.getmuvia.com/products/desk');
      expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain(
        'Enlace copiado',
      );
      i18n.selectLanguage('en');
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain(
        'Link copied',
      );
      expect(fixture.nativeElement.querySelector('h1').textContent).toBe('Escritorio del vendedor');
    } finally {
      vi.unstubAllGlobals();
      i18n.selectLanguage('es');
    }
  });

  it('cancels stale recommendations when a product has no category', () => {
    const pending = new Subject<{ data: Product[] }>();
    getAllProducts.mockReturnValueOnce(pending);
    component.loadSimilarProducts('category', 'current');
    component.loadSimilarProducts('', 'next');
    pending.next({ data: [productFixture()] });
    expect(component.similarProducts()).toEqual([]);
    expect(getAllProducts).toHaveBeenCalledTimes(1);
  });
});
