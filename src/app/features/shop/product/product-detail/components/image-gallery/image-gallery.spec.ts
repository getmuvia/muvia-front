import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MarketService } from '@core/services/market/market';
import { imageFixture, productFixture } from '../../testing/product-fixture';
import { ImageGallery } from './image-gallery';

describe('Published product gallery', () => {
  let fixture: ComponentFixture<ImageGallery>;
  const product = productFixture();

  beforeEach(async () => {
    localStorage.removeItem('muvia.language');
    await TestBed.configureTestingModule({
      imports: [ImageGallery],
      providers: [{ provide: MarketService, useValue: { locale: signal('es-BO') } }],
    }).compileComponents();
    fixture = TestBed.createComponent(ImageGallery);
    fixture.componentRef.setInput('assets', product.assets);
    fixture.componentRef.setInput('dimensions', product.specifications!.dimensions);
    fixture.componentRef.setInput('title', product.title);
    await fixture.whenStable();
  });

  afterEach(() => localStorage.removeItem('muvia.language'));

  it('opens the primary real image and lets customers select another image without mutating assets', () => {
    const originalOrder = product.assets.map((asset) => asset.id);
    expect(fixture.nativeElement.querySelector('.gallery-image img').getAttribute('src')).toBe(
      'https://example.test/primary.webp',
    );
    const thumbnails = fixture.nativeElement.querySelectorAll(
      '.gallery-thumbnail',
    ) as NodeListOf<HTMLButtonElement>;
    thumbnails[1].click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.gallery-image img').getAttribute('src')).toBe(
      'https://example.test/secondary.webp',
    );
    expect(thumbnails[1].getAttribute('aria-pressed')).toBe('true');
    expect(product.assets.map((asset) => asset.id)).toEqual(originalOrder);
  });

  it('switches to the read-only plan through keyboard navigation and uses the API measurements', () => {
    const imagesTab = fixture.nativeElement.querySelector(
      '#product-gallery-images-tab',
    ) as HTMLButtonElement;
    imagesTab.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }),
    );
    fixture.detectChanges();
    expect(
      fixture.nativeElement
        .querySelector('#product-gallery-dimensions-tab')
        .getAttribute('aria-selected'),
    ).toBe('true');
    expect(document.activeElement?.id).toBe('product-gallery-dimensions-tab');
    const diagram = fixture.nativeElement.querySelector('[role="img"]');
    expect(diagram.getAttribute('aria-label')).toContain('140 cm');
    expect(diagram.getAttribute('aria-label')).toContain('75 cm');
    expect(fixture.nativeElement.querySelector('input')).toBeNull();
  });

  it('resets image selection when navigating to a different product', () => {
    fixture.componentInstance.selectImage(1);
    fixture.componentRef.setInput('assets', [imageFixture('next', true)]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.gallery-image img').getAttribute('src')).toBe(
      'https://example.test/next.webp',
    );
    expect(fixture.componentInstance.selectedIndex()).toBe(0);
    fixture.componentInstance.selectImage(10);
    expect(fixture.componentInstance.selectedIndex()).toBe(0);
  });

  it('shows an honest fallback after an image fails and recovers when another image is selected', () => {
    fixture.nativeElement.querySelector('.gallery-image img').dispatchEvent(new Event('error'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.gallery-image').textContent).toContain(
      'Imagen no disponible',
    );
    fixture.componentInstance.selectImage(1);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.gallery-image img')).not.toBeNull();
  });

  it('handles missing images and incomplete dimensions without offering a fictitious plan', () => {
    fixture.componentRef.setInput('assets', []);
    fixture.componentRef.setInput('dimensions', { width: 0, depth: 60, height: 75, unit: 'cm' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Medidas no especificadas');
    expect(fixture.nativeElement.textContent).toContain('Imagen no disponible');
    expect(fixture.nativeElement.querySelector('#product-gallery-dimensions-tab')).toBeNull();
  });

  it('keeps an available model accessible even when there are no product photos', () => {
    fixture.componentRef.setInput('assets', [
      {
        id: 'glb',
        productId: 'desk',
        type: 'model_3d',
        url: 'https://example.test/desk.glb',
        isPrimary: false,
        metadata: { format: 'glb' },
      },
    ]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.gallery-model-action')).toHaveLength(2);
    expect(fixture.nativeElement.querySelector('#product-gallery-dimensions-panel')).not.toBeNull();
  });
});
