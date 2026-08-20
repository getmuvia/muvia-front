import { Component, inject, signal, OnInit, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink, NavigationEnd, ActivatedRoute } from '@angular/router';
import { AuthService } from '@core/auth/services/auth';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-seller-header',
  imports: [RouterLink],
  templateUrl: './seller-header.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './seller-header.css',
})
export class SellerHeader implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  currentUser = this.authService.currentUser;
  isTransparent = signal<boolean>(false);
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
  }
}
