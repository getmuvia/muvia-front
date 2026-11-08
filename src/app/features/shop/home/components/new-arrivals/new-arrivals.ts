import { TranslatePipe, UiTextPipe } from '@core/services/i18n/translation-pipes';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductCard } from '@shared/components/product-card/product-card';
import { NewArrivalsStore } from '@core/services/product/new-arrivals.store';

@Component({
  selector: 'app-new-arrivals',
  imports: [TranslatePipe, UiTextPipe, ProductCard, RouterLink],
  templateUrl: './new-arrivals.html',
  styleUrl: './new-arrivals.css',
})
export class NewArrivals implements OnInit {
  private readonly store = inject(NewArrivalsStore);
  private readonly destroyRef = inject(DestroyRef);

  readonly products = this.store.products;
  readonly isLoading = this.store.isLoading;
  readonly error = this.store.error;
  readonly isInitialLoading = this.store.isInitialLoading;
  readonly isRefreshing = this.store.isRefreshing;

  ngOnInit(): void {
    this.destroyRef.onDestroy(this.store.connect());
  }

  retry(): void {
    this.store.retry();
  }
}
