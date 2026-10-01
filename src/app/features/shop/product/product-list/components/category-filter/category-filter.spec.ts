import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Category } from '@core/models/category/category';
import { CategoryFilter } from './category-filter';

describe('CategoryFilter', () => {
  let fixture: ComponentFixture<CategoryFilter>;

  const categories: Category[] = Array.from({ length: 50 }, (_, index) => ({
    id: `category-${index + 1}`,
    code: `CATEGORY_${index + 1}`,
    name: `Categoría ${String(index + 1).padStart(2, '0')}`,
    parentId: null,
    description: '',
    imageUrl: '',
    level: 1,
    isSelectable: true,
  }));

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CategoryFilter] }).compileComponents();
    fixture = TestBed.createComponent(CategoryFilter);
    fixture.detectChanges();
  });

  it('makes all 50 categories available with an all-categories option', () => {
    fixture.componentRef.setInput('categories', categories);
    fixture.detectChanges();

    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    expect(select.options).toHaveLength(51);
    expect(select.options[0].textContent).toContain('Todas las categorías');
    expect(select.options[50].value).toBe('CATEGORY_50');
  });

  it('keeps a URL selection when the options arrive asynchronously', () => {
    fixture.componentRef.setInput('selectedCode', 'CATEGORY_50');
    fixture.componentRef.setInput('isLoading', true);
    fixture.detectChanges();
    expect((fixture.nativeElement.querySelector('select') as HTMLSelectElement).disabled).toBe(
      true,
    );

    fixture.componentRef.setInput('categories', categories);
    fixture.componentRef.setInput('isLoading', false);
    fixture.detectChanges();

    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    expect(select.value).toBe('CATEGORY_50');
    expect(select.selectedOptions[0].textContent).toContain('Categoría 50');
  });

  it('allows the buyer to clear an unavailable category instead of silently selecting another', () => {
    fixture.componentRef.setInput('selectedCode', 'REMOVED_CATEGORY');
    fixture.componentRef.setInput('categories', categories);
    fixture.detectChanges();
    const emitSpy = vi.spyOn(fixture.componentInstance.selectCategory, 'emit');
    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    expect(select.selectedOptions[0].textContent).toContain('Categoría no disponible');

    select.value = '';
    select.dispatchEvent(new Event('change'));
    expect(emitSpy).toHaveBeenCalledWith('');
  });

  it('provides a local retry when the categories fail to load', () => {
    fixture.componentRef.setInput('error', 'No pudimos cargar las categorías.');
    fixture.detectChanges();
    const retrySpy = vi.spyOn(fixture.componentInstance.retry, 'emit');

    expect((fixture.nativeElement.querySelector('select') as HTMLSelectElement).disabled).toBe(
      true,
    );
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain(
      'No pudimos cargar las categorías.',
    );
    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();
    expect(retrySpy).toHaveBeenCalledOnce();
  });
});
