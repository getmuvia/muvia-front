import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductCondition } from '@core/models/product/product-condition';
import { FilterBar } from './filter-bar';

describe('Condition filter control', () => {
  let fixture: ComponentFixture<FilterBar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [FilterBar] }).compileComponents();
    fixture = TestBed.createComponent(FilterBar);
  });

  it('selects a URL-restored condition during the first render of its options', () => {
    fixture.componentRef.setInput('selectedCondition', ProductCondition.USED);
    fixture.detectChanges();
    const select = fixture.nativeElement.querySelector('#catalog-condition') as HTMLSelectElement;
    expect(select.value).toBe(ProductCondition.USED);
    fixture.componentRef.setInput('selectedCondition', '');
    fixture.detectChanges();
    expect(select.value).toBe('');
  });

  it('defaults to All and emits both an explicit condition and clearing the filter', () => {
    fixture.detectChanges();
    const select = fixture.nativeElement.querySelector('#catalog-condition') as HTMLSelectElement;
    const emit = vi.spyOn(fixture.componentInstance.conditionChange, 'emit');
    expect(select.value).toBe('');
    select.value = ProductCondition.NEW;
    select.dispatchEvent(new Event('change', { bubbles: true }));
    expect(emit).toHaveBeenLastCalledWith(ProductCondition.NEW);
    select.value = '';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    expect(emit).toHaveBeenLastCalledWith('');
  });
});
