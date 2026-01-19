import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, RouterLink, NavigationEnd, ActivatedRoute } from '@angular/router';
import { Auth } from '@core/auth/services/auth';
import { filter } from 'rxjs/operators';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-seller-header',
  imports: [RouterLink, NgClass],
  templateUrl: './seller-header.html',
  styleUrl: './seller-header.css',
})
export class SellerHeader implements OnInit {
  private readonly authService = inject(Auth);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);

  currentUser = this.authService.currentUser;
  isTransparent = signal<boolean>(false);

  ngOnInit(): void {
    this.checkRoute();

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.checkRoute();
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/home']);
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
