import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ShopFooter } from '../components/shop-footer/shop-footer';
import { ShopNavbar } from '../components/shop-navbar/shop-navbar';

@Component({
  selector: 'app-shop-layout',
  imports: [RouterOutlet, ShopNavbar, ShopFooter],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './shop-layout.html',
})
export class ShopLayout {

}
