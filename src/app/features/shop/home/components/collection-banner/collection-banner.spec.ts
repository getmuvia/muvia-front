import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CollectionBanner } from './collection-banner';

describe('CollectionBanner', () => {
  let component: CollectionBanner;
  let fixture: ComponentFixture<CollectionBanner>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CollectionBanner]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CollectionBanner);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
