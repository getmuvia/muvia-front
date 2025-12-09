import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ShopNavbar } from './layout/components/shop-navbar/shop-navbar';
import { ShopFooter } from './layout/components/shop-footer/shop-footer';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ShopNavbar, ShopFooter],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('itera-front');
}
