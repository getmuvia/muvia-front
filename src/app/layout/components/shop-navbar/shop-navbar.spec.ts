import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { signal, WritableSignal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { AuthService } from '@core/auth/services/auth';
import { I18nService } from '@core/services/i18n/i18n';
import { MarketService } from '@core/services/market/market';
import { UserService } from '@core/services/user/user';
import { ShopSearch } from '@features/shop/components/search/shop-search';
import { ShopNavbar } from './shop-navbar';

describe('ShopNavbar', () => {
  let component: ShopNavbar;
  let fixture: ComponentFixture<ShopNavbar>;
  let isAuthenticated: WritableSignal<boolean>;

  beforeEach(async () => {
    localStorage.removeItem('muvia.language');
    localStorage.removeItem('muvia.market');
    isAuthenticated = signal(false);
    await TestBed.configureTestingModule({
      imports: [ShopNavbar],
      providers: [
        provideHttpClient(),
        {
          provide: AuthService,
          useValue: {
            isAuthenticated, currentUser: signal(null),
            getPostAuthRoute: () => '/seller/profile', logout: vi.fn(),
          },
        },
        { provide: UserService, useValue: { vendorProfile: signal(null) } },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShopNavbar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => {
    localStorage.removeItem('muvia.language');
    localStorage.removeItem('muvia.market');
  });

  it('keeps location and language independent within the preferences panel', () => {
    const marketService = TestBed.inject(MarketService);
    const i18n = TestBed.inject(I18nService);
    const trigger = fixture.nativeElement.querySelector('#storefront-preferences-trigger') as HTMLButtonElement;
    trigger.click();
    fixture.detectChanges();
    const panel = fixture.nativeElement.querySelector('#storefront-preferences-panel') as HTMLElement;
    const language = panel.querySelector('select') as HTMLSelectElement;
    language.value = 'en';
    language.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(i18n.language()).toBe('en');
    expect(marketService.selectedMarket().code).toBe('BO');
    expect(trigger.textContent).toContain('Bolivia · English');
    expect(panel.querySelector('a')?.getAttribute('href')).toBe('/location');

    marketService.selectMarket({
      ...marketService.selectedMarket(), code: 'US', name: 'United States', currencyCode: 'USD',
    });
    fixture.detectChanges();
    expect(i18n.language()).toBe('en');
    expect(trigger.textContent).toContain('United States · English');
  });

  it('keeps the search field hidden until the search trigger is activated', () => {
    const trigger = fixture.nativeElement.querySelector('#navbar-search-trigger') as HTMLButtonElement;
    expect(fixture.nativeElement.querySelector('input')).toBeNull();
    expect(fixture.debugElement.query(By.directive(ShopSearch))).toBeNull();

    trigger.click();
    fixture.detectChanges();
    const search = fixture.debugElement.query(By.directive(ShopSearch)).componentInstance as ShopSearch;
    expect(fixture.nativeElement.querySelector('header form[role="search"] input')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[role="dialog"], [aria-modal="true"]')).toBeNull();
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    search.close.emit();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('input')).toBeNull();
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(trigger);
  });

  it('dismisses preferences with Escape and returns focus to their trigger', () => {
    const trigger = fixture.nativeElement.querySelector('#storefront-preferences-trigger') as HTMLButtonElement;
    trigger.click();
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('#storefront-preferences-panel select') as HTMLSelectElement).focus();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(trigger);
  });

  it('closes preferences when focus moves outside them', () => {
    component.togglePreferences();
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('#navbar-search-trigger') as HTMLButtonElement).focus();
    fixture.detectChanges();
    expect(component.isPreferencesOpen()).toBe(false);
  });

  it('preserves the keyboard search shortcut and closes the mobile menu', () => {
    component.toggleMobileMenu();
    fixture.detectChanges();
    const shortcut = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, cancelable: true });
    document.dispatchEvent(shortcut);
    fixture.detectChanges();
    expect(shortcut.defaultPrevented).toBe(true);
    expect(component.isSearchOpen()).toBe(true);
    expect(component.isMobileMenuOpen()).toBe(false);
  });

  it('closes the expanded search when clicking outside the navbar', () => {
    component.openSearch();
    fixture.detectChanges();
    document.body.click();
    fixture.detectChanges();
    expect(component.isSearchOpen()).toBe(false);
    expect(fixture.nativeElement.querySelector('app-shop-search')).toBeNull();
  });

  it('preserves profile and logout actions for an authenticated account', async () => {
    isAuthenticated.set(true);
    await fixture.whenStable();
    (fixture.nativeElement.querySelector('#navbar-user-trigger') as HTMLButtonElement).click();
    fixture.detectChanges();
    const menu = fixture.nativeElement.querySelector('#navbar-user-menu') as HTMLElement;
    expect(menu.querySelector('a')?.getAttribute('href')).toBe('/seller/profile');
    menu.querySelector('button')?.click();
    expect(TestBed.inject(AuthService).logout).toHaveBeenCalledOnce();
    expect(component.isUserMenuOpen()).toBe(false);
  });
});
