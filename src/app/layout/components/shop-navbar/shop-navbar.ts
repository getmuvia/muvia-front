import { Component, computed, inject, signal, OnInit, HostListener, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { AuthService } from '@core/auth/services/auth';
import { filter } from 'rxjs/operators';
import { NgClass } from '@angular/common';
import { SmartSearchModal } from '@features/shop/components/modals/smart-search/smart-search-modal';


@Component({
  selector: 'app-shop-navbar',
  imports: [RouterLink, NgClass, SmartSearchModal],
  templateUrl: './shop-navbar.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './shop-navbar.css',
})
export class ShopNavbar implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);

  isAuthenticated = this.authService.isAuthenticated;
  currentUser = this.authService.currentUser;
  accountRoute = computed(() => this.authService.getPostAuthRoute());

  isTransparent = signal<boolean>(false);
  isSearchOpen = signal<boolean>(false);
  isMobileMenuOpen = signal<boolean>(false);

  /** Listen for Ctrl+K / Cmd+K to open search */
  @HostListener('document:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
      event.preventDefault();
      this.openSearch();
    }
  }

  ngOnInit(): void {
    this.checkRoute();

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.checkRoute();
    });
  }

  openSearch(): void {
    this.isSearchOpen.set(true);
  }

  closeSearch(): void {
    this.isSearchOpen.set(false);
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update(v => !v);
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }

  logout(): void {
    this.authService.logout();
  }

  private checkRoute(): void {
    let route = this.activatedRoute;
    while (route.firstChild) {
      route = route.firstChild;
    }

    const style = route.snapshot.data['headerStyle'];
    this.isTransparent.set(style === 'transparent');
  }
}
