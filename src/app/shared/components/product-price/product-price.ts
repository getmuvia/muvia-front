import { Component, computed, inject, input } from '@angular/core';
import { MarketService } from '@core/services/market/market';

@Component({
  selector: 'app-product-price',
  template: '{{ formattedAmount() }}',
})
export class ProductPrice {
  private readonly market = inject(MarketService);
  readonly amount = input.required<number>();
  readonly currencyCode = input.required<string>();

  private readonly formatter = computed(() => new Intl.NumberFormat(this.market.locale(), {
    style: 'currency',
    currency: this.currencyCode(),
  }));
  readonly formattedAmount = computed(() => this.formatter().format(this.amount()));
}
