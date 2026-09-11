import { Component, computed, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink, NavigationEnd, ActivatedRoute } from '@angular/router';
import { AuthService } from '@core/auth/services/auth';
import { UserService } from '@core/services/user/user';
import { StoreAvatar } from '@shared/components/store-avatar/store-avatar';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-seller-header',
  imports: [RouterLink, StoreAvatar],
  templateUrl: './seller-header.html',
  styleUrl: './seller-header.css',
})
export class SellerHeader implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly userService = inject(UserService);

  currentUser = this.authService.currentUser;
  vendorLogoUrl = computed(() =>
    this.userService.vendorProfile()?.logoUrl || this.currentUser()?.vendorProfile?.logoUrl || ''
  );
  vendorDisplayName = computed(() =>
    this.userService.vendorProfile()?.businessName
      || this.currentUser()?.vendorProfile?.businessName
      || this.currentUser()?.email
      || 'Mi cuenta'
  );
  isTransparent = signal<boolean>(false);
  isProfilePage = signal(false);
  isMobileMenuOpen = signal<boolean>(false);

  ngOnInit(): void {
    this.checkRoute();

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.checkRoute();
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/home']);
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update(v => !v);
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }

  private checkRoute(): void {
    let route = this.activatedRoute;
    while (route.firstChild) {
      route = route.firstChild;
    }

    const style = route.snapshot.data['headerStyle'];
    this.isTransparent.set(style === 'transparent');
    const path = this.router.url.split(/[?#]/, 1)[0];
    this.isProfilePage.set(path === '/seller/profile');
  }
}
