import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoggerService } from '@core/services/logger/logger';
import { MarketService } from '@core/services/market/market';
import { ProductModelViewer } from './product-model-viewer';

vi.mock('@google/model-viewer', () => ({}));

describe('Product model viewer', () => {
  let fixture: ComponentFixture<ProductModelViewer>;
  const originalShow = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'showModal');
  const originalClose = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'close');
  const showDialog = vi.fn(function (this: HTMLDialogElement) {
    this.setAttribute('open', '');
  });
  const closeDialog = vi.fn(function (this: HTMLDialogElement) {
    this.removeAttribute('open');
  });

  beforeAll(() =>
    Object.defineProperties(HTMLDialogElement.prototype, {
      showModal: { configurable: true, value: showDialog },
      close: { configurable: true, value: closeDialog },
    }),
  );

  afterAll(() => {
    if (originalShow) Object.defineProperty(HTMLDialogElement.prototype, 'showModal', originalShow);
    else Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal');
    if (originalClose) Object.defineProperty(HTMLDialogElement.prototype, 'close', originalClose);
    else Reflect.deleteProperty(HTMLDialogElement.prototype, 'close');
  });

  beforeEach(async () => {
    localStorage.removeItem('muvia.language');
    showDialog.mockClear();
    closeDialog.mockClear();
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn(() => 1),
    );
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    await TestBed.configureTestingModule({
      imports: [ProductModelViewer],
      providers: [
        { provide: MarketService, useValue: { locale: signal('es-BO') } },
        { provide: LoggerService, useValue: { error: vi.fn() } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ProductModelViewer);
    fixture.componentRef.setInput('glbAsset', {
      id: 'model',
      url: 'https://example.test/desk.glb',
      metadata: { format: 'glb' },
    });
    fixture.componentRef.setInput('title', 'Escritorio publicado');
    fixture.componentRef.setInput('dimensions', { width: 140, depth: 60, height: 75, unit: 'cm' });
    await fixture.whenStable();
    await vi.waitFor(() => expect(fixture.componentInstance.modelViewerLoaded()).toBe(true));
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    vi.unstubAllGlobals();
    localStorage.removeItem('muvia.language');
  });

  it('opens a named native dialog with the real asset and dismisses it through the cancel event', () => {
    const close = vi.fn();
    fixture.componentInstance.close.subscribe(close);
    const dialog = fixture.nativeElement.querySelector('dialog') as HTMLDialogElement;
    expect(dialog.open).toBe(true);
    expect(fixture.nativeElement.querySelector('#product-model-title').textContent).toContain(
      'Escritorio publicado',
    );
    expect(fixture.nativeElement.querySelector('model-viewer').getAttribute('src')).toBe(
      'https://example.test/desk.glb',
    );
    const cancel = new Event('cancel', { cancelable: true });
    dialog.dispatchEvent(cancel);
    expect(cancel.defaultPrevented).toBe(true);
    expect(dialog.open).toBe(false);
    expect(close).toHaveBeenCalledOnce();
  });

  it('delegates AR activation only when the loaded model is ready', async () => {
    const activateAR = vi.fn().mockResolvedValue(undefined);
    Object.assign(fixture.nativeElement.querySelector('model-viewer'), { activateAR });
    fixture.componentRef.setInput('startInAr', true);
    fixture.detectChanges();
    fixture.componentInstance.onModelLoaded();
    fixture.componentInstance.onModelLoaded();
    await Promise.resolve();
    expect(activateAR).toHaveBeenCalledOnce();
  });

  it('preserves the catalog dimensions and stops tracking overlays on dismissal', () => {
    const updateHotspot = vi.fn();
    Object.assign(fixture.nativeElement.querySelector('model-viewer'), {
      getDimensions: () => ({ x: 1.4, y: 0.75, z: 0.6 }),
      getBoundingBoxCenter: () => ({ x: 0, y: 0.375, z: 0 }),
      updateHotspot,
    });
    fixture.componentInstance.toggleDimensions();
    const render = vi.mocked(requestAnimationFrame).mock.calls.at(-1)![0];
    render(0);
    fixture.detectChanges();
    expect(updateHotspot).toHaveBeenCalledTimes(9);
    expect(updateHotspot).toHaveBeenCalledWith({
      name: 'hotspot-width-start',
      position: '0.7 0.75 -0.3',
    });
    expect(fixture.nativeElement.querySelector('.dimension-label').textContent).toContain('140 cm');
    fixture.componentInstance.onArStatus(
      new CustomEvent('ar-status', { detail: { status: 'session-started' } }),
    );
    fixture.detectChanges();
    expect(
      fixture.nativeElement
        .querySelector('.dimension-label')
        .classList.contains('dimension-overlay--hidden'),
    ).toBe(true);
    fixture.componentInstance.closeModel3dViewer();
    expect(closeDialog).toHaveBeenCalled();
    expect(cancelAnimationFrame).toHaveBeenCalled();
  });

  it('lets customers retry an asset that fails to load', () => {
    fixture.nativeElement.querySelector('model-viewer').dispatchEvent(new Event('error'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain(
      'No pudimos cargar',
    );
    (fixture.nativeElement.querySelector('[role="alert"] button') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('model-viewer').getAttribute('src')).toBe(
      'https://example.test/desk.glb',
    );
  });
});
