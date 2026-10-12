import { TranslatePipe, CountryNamePipe } from '@core/services/i18n/translation-pipes';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MarketService } from '@core/services/market/market';
import { LanguageSelector } from '@shared/components/language-selector/language-selector';

@Component({
  selector: 'app-shop-footer',
  imports: [CountryNamePipe, TranslatePipe, RouterLink, LanguageSelector],
  templateUrl: './shop-footer.html',
  styleUrl: './shop-footer.css',
})
export class ShopFooter {
  readonly marketService = inject(MarketService);
}
