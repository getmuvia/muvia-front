import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShopNavbar } from './shop-navbar';

describe('ShopNavbar', () => {
  let component: ShopNavbar;
  let fixture: ComponentFixture<ShopNavbar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShopNavbar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShopNavbar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
