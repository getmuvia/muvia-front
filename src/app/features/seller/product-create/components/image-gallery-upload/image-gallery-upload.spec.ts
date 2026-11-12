import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImageGalleryUpload } from './image-gallery-upload';

describe('ImageGalleryUpload', () => {
  let component: ImageGalleryUpload;
  let fixture: ComponentFixture<ImageGalleryUpload>;

  beforeEach(async () => {
    let previewCount = 0;
    vi.stubGlobal('URL', class extends URL {
      static override createObjectURL = vi.fn(() => `blob:gallery-${previewCount++}`);
    });
    await TestBed.configureTestingModule({
      imports: [ImageGalleryUpload],
    }).compileComponents();

    fixture = TestBed.createComponent(ImageGalleryUpload);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => vi.unstubAllGlobals());

  function selectFiles(...files: File[]): void {
    const input = fixture.nativeElement.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(input, 'files', { configurable: true, value: files });
    input.dispatchEvent(new Event('change', { bubbles: true }));
    fixture.detectChanges();
  }

  it('opens the same multiple-file picker from the large and small upload buttons', () => {
    const inputs = fixture.nativeElement.querySelectorAll('input[type="file"]') as NodeListOf<HTMLInputElement>;
    expect(inputs).toHaveLength(1);
    expect(inputs[0].multiple).toBe(true);
    const openPicker = vi.spyOn(inputs[0], 'click').mockImplementation(() => {});
    const uploadButtons = fixture.nativeElement.querySelectorAll('button[aria-label="Agregar imágenes"]') as NodeListOf<HTMLButtonElement>;

    expect(uploadButtons).toHaveLength(5);
    uploadButtons.forEach(button => button.click());

    expect(openPicker).toHaveBeenCalledTimes(uploadButtons.length);
  });

  it('adds a batch of images and makes only the first image primary', () => {
    const selected = vi.spyOn(component.fileSelected, 'emit');

    selectFiles(image('front.jpg'), image('side.png'), image('detail.webp'));

    expect(component.assets()).toHaveLength(3);
    expect(component.assets().map(asset => asset.isPrimary)).toEqual([true, false, false]);
    expect(component.primaryImage()?.metadata.alt).toBe('front');
    expect(component.emptySlots()).toHaveLength(2);
    expect(selected).toHaveBeenCalledTimes(3);
  });

  it('preserves the chosen primary image when another batch is selected', () => {
    selectFiles(image('front.jpg'), image('side.png'));
    const existing = component.assets();
    component.setPrimary(existing[1].url);

    selectFiles(image('detail.webp'), image('back.jpg'));

    expect(component.assets()).toHaveLength(4);
    expect(component.primaryImage()?.url).toBe(existing[1].url);
    expect(component.assets().filter(asset => asset.isPrimary)).toHaveLength(1);
  });

  it('accepts a batch dropped over a small slot without changing the primary image', () => {
    selectFiles(image('front.jpg'));
    const primary = component.primaryImage();
    const drop = new Event('drop', { bubbles: true, cancelable: true });
    Object.defineProperty(drop, 'dataTransfer', {
      value: { files: [image('side.png'), image('detail.webp')] },
    });
    const slot = fixture.nativeElement.querySelectorAll('button[aria-label="Agregar imágenes"]')[1];

    slot.dispatchEvent(drop);

    expect(drop.defaultPrevented).toBe(true);
    expect(component.assets()).toHaveLength(3);
    expect(component.primaryImage()).toBe(primary);
    expect(component.isDragging()).toBe(false);
  });

  it('selects the first valid image as primary when a batch also contains rejected files', () => {
    selectFiles(
      new File(['document'], 'catalog.pdf', { type: 'application/pdf' }),
      fileWithSize('large.png', 'image/png', component.maxFileSize + 1),
      image('front.jpg'),
      image('side.png'),
    );

    expect(component.assets()).toHaveLength(2);
    expect(component.primaryImage()?.metadata.alt).toBe('front');
    expect(component.fileErrors()).toHaveLength(2);
  });

  it('adds only the images that fit in the gallery and identifies the excess file', () => {
    selectFiles(image('one.jpg'), image('two.jpg'), image('three.jpg'), image('four.jpg'));
    const primary = component.primaryImage();
    const selected = vi.spyOn(component.fileSelected, 'emit');

    selectFiles(image('five.jpg'), image('six.jpg'));

    expect(component.assets()).toHaveLength(component.maxImages);
    expect(component.primaryImage()).toBe(primary);
    expect(component.emptySlots()).toEqual([]);
    expect(selected).toHaveBeenCalledOnce();
    expect(component.fileErrors()[0]).toContain('six.jpg');
    expect(component.fileErrors()[0]).toContain('máximo es de 5');
  });

  it('identifies a rejected image and explains the supported formats', () => {
    const file = new File(['not-an-image'], 'catalogo.pdf', { type: 'application/pdf' });

    selectFiles(file);

    expect(component.assets()).toEqual([]);
    expect(component.fileErrors()[0]).toContain('catalogo.pdf');
    expect(component.fileErrors()[0]).toContain('JPG, PNG o WEBP');
    expect(fixture.nativeElement.textContent).toContain('catalogo.pdf');
  });

  it('preserves the gallery when an image exceeds 5 MB', () => {
    const existing = {
      url: 'https://storage.example/existing.webp',
      type: 'image' as const,
      isPrimary: true,
      metadata: { alt: 'Existing image' },
    };
    component.assets.set([existing]);
    const file = fileWithSize('sala-grande.png', 'image/png', component.maxFileSize + 1);

    const changed = vi.fn();
    component.assets.subscribe(changed);
    selectFiles(file);

    expect(component.assets()).toEqual([existing]);
    expect(component.fileErrors()[0]).toContain('sala-grande.png');
    expect(component.fileErrors()[0]).toContain('5 MB');
    expect(changed).not.toHaveBeenCalled();
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it('changes and removes the primary image without opening the file picker', () => {
    selectFiles(image('front.jpg'), image('side.png'), image('detail.webp'));
    const original = component.assets();
    const input = fixture.nativeElement.querySelector('input[type="file"]') as HTMLInputElement;
    const openPicker = vi.spyOn(input, 'click').mockImplementation(() => {});
    const choosePrimary = fixture.nativeElement.querySelector('button[title="Hacer principal"]') as HTMLButtonElement;

    choosePrimary.click();
    fixture.detectChanges();
    expect(component.primaryImage()?.url).toBe(original[1].url);
    const removePrimary = fixture.nativeElement.querySelector('button[aria-label="Eliminar imagen principal"]') as HTMLButtonElement;
    removePrimary.click();

    expect(component.assets()).toHaveLength(2);
    expect(component.primaryImage()?.url).toBe(original[0].url);
    expect(openPicker).not.toHaveBeenCalled();
  });

  it('blocks selection and drops while the product is being saved', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    const drop = new Event('drop', { bubbles: true, cancelable: true });
    Object.defineProperty(drop, 'dataTransfer', { value: { files: [image('side.png')] } });
    const upload = fixture.nativeElement.querySelector('button[aria-label="Agregar imágenes"]');

    selectFiles(image('front.jpg'));
    upload.dispatchEvent(drop);

    expect(component.assets()).toEqual([]);
    expect(Array.from(fixture.nativeElement.querySelectorAll('button'))
      .every(button => (button as HTMLButtonElement).disabled)).toBe(true);
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });
});

function image(name: string): File {
  const type = name.endsWith('.png') ? 'image/png' : name.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
  return new File(['image'], name, { type });
}

function fileWithSize(name: string, type: string, size: number): File {
  const file = new File(['content'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}
