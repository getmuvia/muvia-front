import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HybridSearchInterpretation } from '@core/models/search/hybrid-search.model';
import { SearchInterpretation } from './search-interpretation';
import { I18nService } from '@core/services/i18n/i18n';

describe('SearchInterpretation', () => {
  afterEach(() => localStorage.removeItem('muvia.language'));
  let component: SearchInterpretation;
  let fixture: ComponentFixture<SearchInterpretation>;

  const interpretation: HybridSearchInterpretation = {
    summary: 'Escritorio · Madera · Máximo 100 cm de ancho',
    source: 'ai',
    category: { code: 'DESK', label: 'Escritorio' },
    material: { code: 'WOOD', label: 'Madera' },
    measurement: { dimension: 'width', maxDimensionCm: 100 },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchInterpretation],
    }).compileComponents();

    fixture = TestBed.createComponent(SearchInterpretation);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('query', 'quiero un escritorio de madera de 100 cm');
    fixture.componentRef.setInput('interpretation', interpretation);
    fixture.detectChanges();
  });

  it('renders the validated buyer-facing summary without exposing its technical source', () => {
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Muvia entendió');
    expect(text).toContain(interpretation.summary);
    expect(text).not.toContain('ai');
    expect(text).not.toContain('Gemini');
  });

  it('localizes structured interpretation labels without rewriting the original query', () => {
    TestBed.inject(I18nService).selectLanguage('en');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Muvia understood');
    expect(fixture.nativeElement.textContent).toContain('Desk · Wood · Maximum 100 cm in width');
    expect(component.query()).toBe('quiero un escritorio de madera de 100 cm');
    expect(component.interpretation()).toEqual(interpretation);
  });

  it('emits a normalized natural-language correction', () => {
    let emittedQuery = '';
    component.refineSearch.subscribe(query => emittedQuery = query);

    const editButton = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    editButton.click();
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.value = '  quiero   un escritorio de 100 cm de alto  ';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));

    expect(emittedQuery).toBe('quiero un escritorio de 100 cm de alto');
  });

  it('does not render editing controls in compact read-only mode', () => {
    fixture.componentRef.setInput('compact', true);
    fixture.componentRef.setInput('editable', false);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('button')).toBeNull();
    expect(fixture.nativeElement.querySelector('form')).toBeNull();
  });
});
