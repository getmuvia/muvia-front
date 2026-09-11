import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StoreAvatar } from './store-avatar';

describe('StoreAvatar', () => {
  let component: StoreAvatar;
  let fixture: ComponentFixture<StoreAvatar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StoreAvatar],
    }).compileComponents();

    fixture = TestBed.createComponent(StoreAvatar);
    component = fixture.componentInstance;
  });

  it('should render the store logo with an accessible description', () => {
    fixture.componentRef.setInput('logoUrl', 'https://cdn.example.com/decor-logo.webp');
    fixture.componentRef.setInput('storeName', 'Decor');
    fixture.detectChanges();

    const image = fixture.nativeElement.querySelector('img') as HTMLImageElement;
    expect(image).not.toBeNull();
    expect(image.src).toContain('decor-logo.webp');
    expect(image.alt).toBe('Logo de Decor');
  });

  it('should display the fallback icon when the logo cannot be loaded', () => {
    fixture.componentRef.setInput('logoUrl', 'https://cdn.example.com/missing.webp');
    fixture.componentRef.setInput('fallbackIcon', 'person');
    fixture.detectChanges();

    const image = fixture.nativeElement.querySelector('img') as HTMLImageElement;
    image.dispatchEvent(new Event('error'));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('img')).toBeNull();
    expect(fixture.nativeElement.querySelector('.material-symbols-outlined').textContent.trim()).toBe('person');
  });
});
