import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { ShopFooter } from '../components/shop-footer/shop-footer';
import { ShopNavbar } from '../components/shop-navbar/shop-navbar';

@Component({
  selector: 'app-shop-layout',
  imports: [RouterOutlet, ShopNavbar, ShopFooter],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shop-layout.html',
})
export class ShopLayout {
  private readonly router = inject(Router);

  readonly showFooter = toSignal(
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => !this.router.url.startsWith('/auth'))
    ),
    { initialValue: !this.router.url.startsWith('/auth') }
  );
}
