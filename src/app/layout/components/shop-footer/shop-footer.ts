import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MarketService } from '@core/services/market/market';

@Component({
  selector: 'app-shop-footer',
  imports: [RouterLink],
  templateUrl: './shop-footer.html',
  styleUrl: './shop-footer.css',
})
export class ShopFooter {
  readonly marketService = inject(MarketService);
}
