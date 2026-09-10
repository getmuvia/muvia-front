import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Pagination } from './pagination';

describe('Pagination', () => {
  let component: Pagination;
  let fixture: ComponentFixture<Pagination>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Pagination],
    }).compileComponents();

    fixture = TestBed.createComponent(Pagination);
    fixture.componentRef.setInput('currentPage', 4);
    fixture.componentRef.setInput('totalPages', 8);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should calculate a compact list of visible pages', () => {
    expect(component.visiblePages()).toEqual([1, '...', 3, 4, 5, '...', 8]);
  });

  it('should emit only valid page changes', () => {
    const emittedPages: number[] = [];
    component.pageChange.subscribe(page => emittedPages.push(page));

    component.goToPage(5);
    component.goToPage(4);
    component.goToPage(9);

    expect(emittedPages).toEqual([5]);
  });
});
