import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShopLayout } from './shop-layout';

describe('ShopLayout', () => {
  let component: ShopLayout;
  let fixture: ComponentFixture<ShopLayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShopLayout]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShopLayout);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
