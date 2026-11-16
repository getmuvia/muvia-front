import { TranslatePipe, CountryNamePipe } from '@core/services/i18n/translation-pipes';
import { Component, computed, inject, signal, OnInit, HostListener, DestroyRef, ElementRef, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink, Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { AuthService } from '@core/auth/services/auth';
import { filter } from 'rxjs/operators';
import { NgClass, NgTemplateOutlet } from '@angular/common';
import { ShopSearch } from '@features/shop/components/search/shop-search';
import { MarketService } from '@core/services/market/market';
import { UserService } from '@core/services/user/user';
import { StoreAvatar } from '@shared/components/store-avatar/store-avatar';
import { LanguageSelector } from '@shared/components/language-selector/language-selector';
import { I18nService } from '@core/services/i18n/i18n';


@Component({
  selector: 'app-shop-navbar',
  imports: [CountryNamePipe, TranslatePipe, RouterLink, NgClass, NgTemplateOutlet, ShopSearch, StoreAvatar, LanguageSelector],
  templateUrl: './shop-navbar.html',
  styleUrl: './shop-navbar.css',
})
export class ShopNavbar implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly userService = inject(UserService);
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly shopSearch = viewChild(ShopSearch);
  readonly marketService = inject(MarketService);
  private readonly i18n = inject(I18nService);
  readonly languageCode = computed(() => this.i18n.language().toUpperCase());

  isAuthenticated = this.authService.isAuthenticated;
  currentUser = this.authService.currentUser;
  accountRoute = computed(() => this.authService.getPostAuthRoute());
  vendorLogoUrl = computed(() =>
    this.userService.vendorProfile()?.logoUrl || this.currentUser()?.vendorProfile?.logoUrl || ''
  );
  vendorDisplayName = computed(() =>
    this.userService.vendorProfile()?.businessName
      || this.currentUser()?.vendorProfile?.businessName
      || this.currentUser()?.email
      || this.i18n.text('Mi Cuenta')
  );

  isTransparent = signal(false);
  isOverlay = signal<boolean>(false);
  isSearchOpen = signal<boolean>(false);
  isMobileMenuOpen = signal<boolean>(false);
  isUserMenuOpen = signal<boolean>(false);
  isPreferencesOpen = signal(false);

  /** Keep search shortcuts and dismissible navigation available from the keyboard. */
  @HostListener('document:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
      event.preventDefault();
      this.openSearch();
    } else if (event.key === 'Escape') {
      if (this.isSearchOpen()) this.closeSearch();
      if (this.isPreferencesOpen()) {
        this.closePreferences();
        this.elementRef.nativeElement.querySelector<HTMLButtonElement>('#storefront-preferences-trigger')?.focus();
      }
      if (this.isUserMenuOpen()) {
        this.elementRef.nativeElement.querySelector<HTMLButtonElement>('#navbar-user-trigger')?.focus();
      }
      if (this.isMobileMenuOpen()) {
        this.elementRef.nativeElement.querySelector<HTMLButtonElement>('#navbar-mobile-trigger')?.focus();
      }
      this.closeUserMenu();
      this.closeMobileMenu();
    }
  }

  @HostListener('document:click', ['$event'])
  @HostListener('document:focusin', ['$event'])
  handleDocumentClick(event: MouseEvent | FocusEvent): void {
    if (!this.isUserMenuOpen() && !this.isPreferencesOpen() && !this.isSearchOpen()) return;
    const target = event.target as Node | null;
    if (!target) return;
    if (this.isSearchOpen() && !this.elementRef.nativeElement.contains(target)) {
      this.closeSearch(false);
    }
    const userMenu = this.elementRef.nativeElement.querySelector('.user-menu');
    if (this.isUserMenuOpen() && userMenu && !userMenu.contains(target)) {
      this.closeUserMenu();
    }
    const preferences = this.elementRef.nativeElement.querySelector('.storefront-preferences');
    if (this.isPreferencesOpen() && preferences && !preferences.contains(target)) {
      this.closePreferences();
    }
  }

  ngOnInit(): void {
    this.checkRoute();

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.closeUserMenu();
      this.closePreferences();
      this.closeMobileMenu();
      this.closeSearch(false);
      this.checkRoute();
    });
  }

  openSearch(): void {
    this.closeUserMenu();
    this.closePreferences();
    this.closeMobileMenu();
    this.isSearchOpen.set(true);
    this.shopSearch()?.focusInput();
  }

  toggleSearch(): void {
    if (this.isSearchOpen()) this.closeSearch();
    else this.openSearch();
  }

  closeSearch(restoreFocus = true): void {
    this.isSearchOpen.set(false);
    if (restoreFocus) {
      this.elementRef.nativeElement.querySelector<HTMLButtonElement>('#navbar-search-trigger')?.focus();
    }
  }

  toggleMobileMenu(): void {
    this.closeSearch(false);
    this.closeUserMenu();
    this.closePreferences();
    this.isMobileMenuOpen.update(v => !v);
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }

  toggleUserMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.closeSearch(false);
    this.closePreferences();
    this.isUserMenuOpen.update(v => !v);
  }

  togglePreferences(): void {
    this.closeSearch(false);
    this.closeUserMenu();
    this.isPreferencesOpen.update(open => !open);
  }

  closePreferences(): void {
    this.isPreferencesOpen.set(false);
  }

  closeUserMenu(): void {
    this.isUserMenuOpen.set(false);
  }

  logout(): void {
    this.closeUserMenu();
    this.authService.logout();
  }

  private checkRoute(): void {
    let route = this.activatedRoute;
    while (route.firstChild) {
      route = route.firstChild;
    }

    const path = this.router.url.split(/[?#]/, 1)[0];
    const fallbackStyle = path === '/home'
      ? 'transparent'
      : path.startsWith('/auth/') ? 'overlay' : undefined;
    const style = route.snapshot.data['headerStyle'] ?? fallbackStyle;
    this.isTransparent.set(style === 'transparent');
    this.isOverlay.set(style === 'overlay');
  }
}
