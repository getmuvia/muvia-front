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

  it('should hide the store name in the account control on the profile page', () => {
    component.isProfilePage.set(true);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.seller-account-name')).toBeNull();
  });

  it('should keep the store name in the account control on other seller pages', () => {
    component.isProfilePage.set(false);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.seller-account-name')).not.toBeNull();
  });
});
