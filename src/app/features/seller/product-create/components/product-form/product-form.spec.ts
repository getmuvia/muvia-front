import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Category } from '@core/models/category/category';
import { ProductForm } from './product-form';
import { I18nService } from '@core/services/i18n/i18n';
import { ProductCondition } from '@core/models/product/product-condition';
import { INITIAL_PRODUCT_FORM } from '@core/models/product/product-form.model';

describe('ProductForm validation recovery', () => {
  afterEach(() => localStorage.removeItem('muvia.language'));
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

  it('preselects NEW and updates the form when the seller chooses USED', () => {
    const select = fixture.nativeElement.querySelector('#product-condition') as HTMLSelectElement;
    expect(select.value).toBe(ProductCondition.NEW);
    expect(component.productModel().condition).toBe(ProductCondition.NEW);
    select.value = ProductCondition.USED;
    select.dispatchEvent(new Event('input', { bubbles: true }));
    select.dispatchEvent(new Event('change', { bubbles: true }));
    fixture.detectChanges();
    expect(component.productModel().condition).toBe(ProductCondition.USED);
    expect(fixture.nativeElement.textContent).toContain('Describe su conservación');
  });

  it('loads a used product for editing and preserves its condition when price changes', () => {
    fixture.componentRef.setInput('initialData', { ...INITIAL_PRODUCT_FORM, condition: ProductCondition.USED });
    fixture.detectChanges();
    component.productModel.update(value => ({ ...value, price: 150 }));
    fixture.detectChanges();
    expect((fixture.nativeElement.querySelector('#product-condition') as HTMLSelectElement).value)
      .toBe(ProductCondition.USED);
    expect(component.productModel().condition).toBe(ProductCondition.USED);
  });

  it('requires a valid condition and translates its retained validation errors', () => {
    component.productModel.update(value => ({ ...value, condition: '' as ProductCondition }));
    component.productForm.condition().markAsTouched();
    fixture.detectChanges();
    expect(component.productForm.condition().errors().length).toBeGreaterThan(0);
    TestBed.inject(I18nService).selectLanguage('en');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#product-condition-error').textContent)
      .toContain('Select the product condition');
  });

  it('switches labels and retained validation errors without resetting a draft', () => {
    component.productModel.update(value => ({ ...value, title: 'Mi escritorio', description: 'Mi descripción original' }));
    component.productForm.price().markAsTouched();
    fixture.detectChanges();
    const draft = structuredClone(component.productModel());
    const i18n = TestBed.inject(I18nService);
    i18n.selectLanguage('en');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Product title');
    expect(fixture.nativeElement.textContent).toContain('Price must be greater than 0');
    expect((fixture.nativeElement.querySelector('#product-title') as HTMLInputElement).value).toBe('Mi escritorio');
    expect(component.productModel()).toEqual(draft);
    expect(component.productForm.price().touched()).toBe(true);

    i18n.selectLanguage('es');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('El precio debe ser mayor a 0');
  });

  it('disables editable controls and ignores repeated submission while saving', async () => {
    fixture.componentRef.setInput('isSubmitting', true);
    fixture.detectChanges();
    const submitSpy = vi.spyOn(component.formSubmit, 'emit');

    expect(fixture.nativeElement.querySelector('fieldset').disabled).toBe(true);
    expect(fixture.nativeElement.querySelector('#product-title').matches(':disabled')).toBe(true);
    await component.onSubmit(new Event('submit'));

    expect(submitSpy).not.toHaveBeenCalled();
    expect(component.showValidationSummary()).toBe(false);
  });
});
