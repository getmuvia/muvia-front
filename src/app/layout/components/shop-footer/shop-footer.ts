import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-shop-footer',
  imports: [RouterLink],
  templateUrl: './shop-footer.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './shop-footer.css',
})
export class ShopFooter {

}
