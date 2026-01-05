import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '@core/auth/services/auth';

@Component({
  selector: 'app-seller-header',
  imports: [RouterLink],
  templateUrl: './seller-header.html',
  styleUrl: './seller-header.css',
})
export class SellerHeader {
  private readonly authService = inject(Auth);
  private readonly router = inject(Router);

  currentUser = this.authService.currentUser;

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/home']);
  }
}
