import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SellerHeader } from '../components/seller-header/seller-header';
import { ShopFooter } from '../components/shop-footer/shop-footer';

@Component({
  selector: 'app-seller-layout',
  imports: [RouterOutlet, SellerHeader, ShopFooter],
  templateUrl: './seller-layout.html',
  styleUrl: './seller-layout.css',
})
export class SellerLayout { }
