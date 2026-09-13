import { Component, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { ShopFooter } from '../components/shop-footer/shop-footer';
import { ShopNavbar } from '../components/shop-navbar/shop-navbar';

@Component({
  selector: 'app-shop-layout',
  imports: [RouterOutlet, ShopNavbar, ShopFooter],
  templateUrl: './shop-layout.html',
})
export class ShopLayout {
  private readonly router = inject(Router);

  readonly showFooter = toSignal(
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => !this.hidesFooter(this.router.url))
    ),
    { initialValue: !this.hidesFooter(this.router.url) }
  );

  private hidesFooter(url: string): boolean {
    return url.startsWith('/auth');
  }
}
