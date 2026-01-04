import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SellerHeader } from './seller-header';

describe('SellerHeader', () => {
  let component: SellerHeader;
  let fixture: ComponentFixture<SellerHeader>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SellerHeader]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SellerHeader);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
