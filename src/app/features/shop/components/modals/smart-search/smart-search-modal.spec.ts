import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HybridSearchService } from '@core/services/search/hybrid-search';
import { LoggerService } from '@core/services/logger/logger';
import { SmartSearchModal } from './smart-search-modal';

describe('SmartSearchModal', () => {
  let component: SmartSearchModal;
  let fixture: ComponentFixture<SmartSearchModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SmartSearchModal],
      providers: [
        {
          provide: HybridSearchService,
          useValue: { search: () => undefined },
        },
        {
          provide: LoggerService,
          useValue: { error: () => undefined },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SmartSearchModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders a compact interpretation without refinement controls', () => {
    component.query.set('escritorio de madera');
    component.interpretation.set({
      summary: 'Escritorio · Madera',
      source: 'ai',
    });
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Muvia entendió');
    expect(text).toContain('Escritorio · Madera');
    expect(text).not.toContain('Ajustar búsqueda');
  });
});
