import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SellerHeader } from '../components/seller-header/seller-header';


@Component({
  selector: 'app-seller-layout',
  imports: [RouterOutlet, SellerHeader],
  templateUrl: './seller-layout.html',
  styleUrl: './seller-layout.css',
})
export class SellerLayout {

}
