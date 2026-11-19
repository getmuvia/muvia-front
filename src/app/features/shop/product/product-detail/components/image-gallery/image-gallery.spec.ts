import { ComponentFixture, TestBed } from '@angular/core/testing';
import { imageFixture, productFixture } from '../../testing/product-fixture';
import { ImageGallery } from './image-gallery';

describe('Published product gallery', () => {
  let fixture: ComponentFixture<ImageGallery>;
  const product = productFixture();

  beforeEach(async () => {
    localStorage.removeItem('muvia.language');
    await TestBed.configureTestingModule({
      imports: [ImageGallery],
    }).compileComponents();
    fixture = TestBed.createComponent(ImageGallery);
    fixture.componentRef.setInput('assets', product.assets);
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

  it('opens the selected image in a dialog and navigates with the arrow keys', () => {
    const page = fixture.nativeElement as HTMLElement;
    const dialog = page.querySelector('dialog')!;
    dialog.showModal = vi.fn();

    page.querySelector<HTMLButtonElement>('.gallery-image-button')!.click();
    fixture.detectChanges();
    expect(dialog.showModal).toHaveBeenCalledOnce();
    expect(dialog.querySelector('.gallery-enlarged-image img')?.getAttribute('src'))
      .toBe('https://example.test/primary.webp');

    dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    fixture.detectChanges();
    expect(dialog.querySelector('.gallery-enlarged-image img')?.getAttribute('src'))
      .toBe('https://example.test/secondary.webp');
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

  it('does not offer image enlargement when there are no photos', () => {
    fixture.componentRef.setInput('assets', []);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Imagen no disponible');
    expect(fixture.nativeElement.querySelector('[aria-haspopup="dialog"]')).toBeNull();
  });
});
