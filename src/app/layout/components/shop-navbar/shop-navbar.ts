import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Auth } from '@core/auth/services/auth';

@Component({
  selector: 'app-shop-navbar',
  imports: [RouterLink],
  templateUrl: './shop-navbar.html',
  styleUrl: './shop-navbar.css',
})
export class ShopNavbar {
  private readonly authService = inject(Auth);

  isAuthenticated = this.authService.isAuthenticated;
  currentUser = this.authService.currentUser;

  logout(): void {
    this.authService.logout();
  }
}
