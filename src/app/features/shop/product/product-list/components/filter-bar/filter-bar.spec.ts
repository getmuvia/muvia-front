import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FilterBar } from './filter-bar';

describe('FilterBar', () => {
  let component: FilterBar;
  let fixture: ComponentFixture<FilterBar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilterBar],
    }).compileComponents();

    fixture = TestBed.createComponent(FilterBar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('waits for an explicit submit and clears the draft afterwards', () => {
    const submitSpy = vi.spyOn(component.searchSubmit, 'emit');
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    input.value = 'quiero un escritorio';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(submitSpy).not.toHaveBeenCalled();

    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(submitSpy).toHaveBeenCalledOnce();
    expect(submitSpy).toHaveBeenCalledWith('quiero un escritorio');
    expect(input.value).toBe('');
  });

  it('presents the empty input as a place to add context after a search', () => {
    fixture.componentRef.setInput('activeSearch', 'quiero un escritorio');
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    expect(input.value).toBe('');
    expect(input.placeholder).toBe('Añade otro detalle...');
  });
});
