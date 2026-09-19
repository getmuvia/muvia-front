import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImageGalleryUpload } from './image-gallery-upload';

describe('ImageGalleryUpload', () => {
  let component: ImageGalleryUpload;
  let fixture: ComponentFixture<ImageGalleryUpload>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImageGalleryUpload],
    }).compileComponents();

    fixture = TestBed.createComponent(ImageGalleryUpload);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('identifies a rejected image and explains the supported formats', () => {
    const file = new File(['not-an-image'], 'catalogo.pdf', { type: 'application/pdf' });

    component.onFileSelect(fileEvent(file), true);
    fixture.detectChanges();

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

    component.onFileSelect(fileEvent(file), false);

    expect(component.assets()).toEqual([existing]);
    expect(component.fileErrors()[0]).toContain('sala-grande.png');
    expect(component.fileErrors()[0]).toContain('5 MB');
  });
});

function fileEvent(file: File): Event {
  return {
    target: { files: [file], value: '' },
  } as unknown as Event;
}

function fileWithSize(name: string, type: string, size: number): File {
  const file = new File(['content'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}
