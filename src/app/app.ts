import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ShopNavbar } from './layout/components/shop-navbar/shop-navbar';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ShopNavbar],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('itera-front');
}
