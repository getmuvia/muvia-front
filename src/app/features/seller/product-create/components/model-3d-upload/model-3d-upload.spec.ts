import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Model3dUpload } from './model-3d-upload';

describe('Model3dUpload', () => {
  let component: Model3dUpload;
  let fixture: ComponentFixture<Model3dUpload>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Model3dUpload],
    }).compileComponents();

    fixture = TestBed.createComponent(Model3dUpload);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('identifies an invalid GLB file and gives the corrective action', () => {
    const file = new File(['model'], 'mesa.obj', { type: 'application/octet-stream' });

    component.onFileSelectGlb(fileEvent(file));
    fixture.detectChanges();

    expect(component.glbAsset()).toBeNull();
    expect(component.glbFileError()).toContain('mesa.obj');
    expect(component.glbFileError()).toContain('GLB o GLTF');
    expect(fixture.nativeElement.textContent).toContain('mesa.obj');
  });

  it('rejects a USDZ file over 50 MB without replacing the current model', () => {
    const existing = {
      url: 'https://storage.example/current.usdz',
      type: 'model_3d' as const,
      isPrimary: false,
      metadata: { format: 'usdz' },
    };
    component.usdzAsset.set(existing);
    const file = fileWithSize('habitacion.usdz', component.maxModelSize + 1);

    component.onFileSelectUsdz(fileEvent(file));

    expect(component.usdzAsset()).toEqual(existing);
    expect(component.usdzFileError()).toContain('habitacion.usdz');
    expect(component.usdzFileError()).toContain('50 MB');
  });
});

function fileEvent(file: File): Event {
  return {
    target: { files: [file], value: '' },
  } as unknown as Event;
}

function fileWithSize(name: string, size: number): File {
  const file = new File(['content'], name, { type: 'model/vnd.usdz+zip' });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}
