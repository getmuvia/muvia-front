import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ShopFooter } from '../components/shop-footer/shop-footer';
import { ShopNavbar } from '../components/shop-navbar/shop-navbar';

@Component({
  selector: 'app-shop-layout',
  imports: [RouterOutlet, ShopNavbar, ShopFooter],
  templateUrl: './shop-layout.html',
  styleUrl: './shop-layout.css',
})
export class ShopLayout {

}
