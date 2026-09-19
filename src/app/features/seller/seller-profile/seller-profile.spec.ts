import { signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { Product } from '@core/models/product/product';
import { AuthService } from '@core/auth/services/auth';
import { ProductStore } from '@core/services/product/product.store';
import { UserService } from '@core/services/user/user';
import { SellerProfile } from './seller-profile';

describe('SellerProfile', () => {
  let component: SellerProfile;
  let fixture: ComponentFixture<SellerProfile>;
  let productsState: WritableSignal<Product[]>;
  let loadUserProducts: ReturnType<typeof vi.fn>;
  let loadVendorProfile: ReturnType<typeof vi.fn>;
  let updateProfile: ReturnType<typeof vi.fn>;
  let profileLoadingState: WritableSignal<boolean>;
  let profileErrorState: WritableSignal<string | null>;

  beforeEach(async () => {
    productsState = signal<Product[]>([]);
    loadUserProducts = vi.fn();
    loadVendorProfile = vi.fn();
    updateProfile = vi.fn().mockReturnValue(of({}));
    profileLoadingState = signal(true);
    profileErrorState = signal<string | null>(null);

    await TestBed.configureTestingModule({
      imports: [SellerProfile],
      providers: [
        {
          provide: AuthService,
          useValue: {
            currentUser: signal({ id: 'seller-id' }).asReadonly(),
          },
        },
        {
          provide: UserService,
          useValue: {
            vendorProfile: signal(null).asReadonly(),
            isVendorProfileLoading: profileLoadingState.asReadonly(),
            vendorProfileError: profileErrorState.asReadonly(),
            loadVendorProfile,
            updateProfile,
          },
        },
      ],
    })
    .overrideComponent(SellerProfile, {
      set: {
        providers: [{
          provide: ProductStore,
          useValue: {
            products: productsState.asReadonly(),
            isLoading: signal(false).asReadonly(),
            isError: signal(false).asReadonly(),
            error: signal(null).asReadonly(),
            loadUserProducts,
          },
        }]
      }
    })
    .compileComponents();

    fixture = TestBed.createComponent(SellerProfile);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load the seller profile and products during initialization', () => {
    expect(loadVendorProfile).toHaveBeenCalledWith('seller-id');
    expect(loadUserProducts).toHaveBeenCalledOnce();
  });

  it('should expose a recoverable profile error after the initial request fails', () => {
    profileLoadingState.set(false);
    profileErrorState.set('No pudimos cargar la información de tu negocio.');
    fixture.detectChanges();
    loadVendorProfile.mockClear();

    expect(component.isProfileLoading()).toBe(false);
    expect(component.isProfileError()).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('No pudimos cargar tu perfil');

    component.retryProfile();
    expect(loadVendorProfile).toHaveBeenCalledWith('seller-id');
  });

  it('should paginate products in pages of 10', () => {
    const products = Array.from(
      { length: 21 },
      (_, index) => ({ id: `product-${index}` }) as Product
    );
    productsState.set(products);

    expect(component.visibleProducts()).toHaveLength(10);
    expect(component.visibleProducts()[0]?.id).toBe('product-0');
    expect(component.totalProductPages()).toBe(3);

    component.changeProductPage(2);
    expect(component.visibleProducts()).toHaveLength(10);
    expect(component.visibleProducts()[0]?.id).toBe('product-10');

    component.changeProductPage(3);
    expect(component.visibleProducts()).toHaveLength(1);
    expect(component.visibleProducts()[0]?.id).toBe('product-20');
  });

  it('should update the seller name and description through the current-user endpoint', async () => {
    component.isMetadataModalOpen.set(true);

    await component.onSaveMetadata({
      businessName: 'Muvia Decor',
      description: 'Muebles para espacios contemporáneos.',
    });

    expect(updateProfile).toHaveBeenCalledWith({
      vendorProfile: {
        businessName: 'Muvia Decor',
        description: 'Muebles para espacios contemporáneos.',
      },
    });
    expect(component.isMetadataModalOpen()).toBe(false);
    expect(component.isSaving()).toBe(false);
  });
});
