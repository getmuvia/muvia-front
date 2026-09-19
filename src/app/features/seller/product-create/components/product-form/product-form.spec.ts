import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Category } from '@core/models/category/category';
import { ProductForm } from './product-form';

describe('ProductForm validation recovery', () => {
  let component: ProductForm;
  let fixture: ComponentFixture<ProductForm>;

  const category: Category = {
    id: 'category-id',
    code: 'chairs',
    parentId: null,
    name: 'Sillas',
    description: '',
    imageUrl: '',
    level: 0,
    isSelectable: true,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductForm],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductForm);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('categories', [category]);
    fixture.componentRef.setInput('isLoadingCategories', false);
    Object.defineProperty(Element.prototype, 'scrollIntoView', {
      configurable: true,
      value: vi.fn(),
    });
    fixture.detectChanges();
  });

  it('summarizes invalid sections and navigates to the first one', async () => {
    const submitSpy = vi.spyOn(component.formSubmit, 'emit');

    await component.onSubmit(new Event('submit'));
    await Promise.resolve();
    fixture.detectChanges();

    expect(submitSpy).not.toHaveBeenCalled();
    expect(component.productForm.title().touched()).toBe(true);
    expect(component.validationSummary().map(item => item.section)).toEqual([
      'basic',
      'specifications',
      'keywords',
      'media',
    ]);
    expect(component.openSection()).toBe('basic');
    expect(document.activeElement?.id).toBe('product-title');
    expect(fixture.nativeElement.textContent).toContain('Revisa 4 secciones');
  });
});
