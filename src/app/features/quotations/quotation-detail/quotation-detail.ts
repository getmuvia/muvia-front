import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  effect,
  inject,
  input,
  signal,
  DestroyRef,
  ElementRef,
  Injector,
  afterNextRender,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/services/auth';
import { Quotation, QUOTATION_STATUS_LABELS } from '@core/models/quotation/quotation';
import { TranslatePipe } from '@core/services/i18n/translation-pipes';
import { MarketService } from '@core/services/market/market';
import { QuotationService } from '@core/services/quotation/quotation.service';
import { QuotationStore } from '@core/services/quotation/quotation.store';
import { ProductPrice } from '@shared/components/product-price/product-price';
import { DimensionComparison } from '../components/dimension-comparison/dimension-comparison';
import { QuotationResponse } from '../components/quotation-response/quotation-response';

@Component({
  selector: 'app-quotation-detail',
  imports: [RouterLink, TranslatePipe, ProductPrice, DimensionComparison, QuotationResponse],
  providers: [QuotationStore],
  templateUrl: './quotation-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuotationDetail {
  private readonly auth = inject(AuthService);
  private readonly api = inject(QuotationService);
  private readonly market = inject(MarketService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);
  private readonly answerHeading = viewChild<ElementRef<HTMLElement>>('answerHeading');
  readonly store = inject(QuotationStore);
  readonly id = input.required<string>();
  readonly confirmed = inject(ActivatedRoute).snapshot.queryParamMap.get('created') === '1';
  readonly responseSaved = signal(false);
  readonly statuses = QUOTATION_STATUS_LABELS;
  private readonly sessionUserId = computed(() => this.auth.currentUser()?.id ?? null);
  readonly referencePrice = computed(() => Number(this.store.selected()?.publishedPrice ?? 0));
  readonly quotedPrice = computed(() => Number(this.store.selected()?.quotedPrice ?? 0));
  readonly isSeller = computed(
    () => this.store.selected()?.sellerId === this.auth.currentUser()?.id,
  );
  readonly backRoute = computed(() => (this.isSeller() ? '/seller/quotations' : '/quotations'));

  constructor() {
    effect(() => {
      if (this.sessionUserId()) {
        this.store.loadOne(this.id());
      } else {
        this.store.clear();
        void this.router.navigate(['/auth/login'], {
          queryParams: { returnUrl: this.router.url },
          replaceUrl: true,
        });
      }
    });
    effect(() => {
      const quotation = this.store.selected();
      if (quotation)
        this.api
          .markRead(quotation.id, quotation.respondedAt)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({ error: () => {} });
    });
  }
  @HostListener('window:focus') onWindowFocus(): void {
    if (!this.isSeller() || this.store.selected()?.status !== 'PENDING') this.refresh();
  }
  refresh(): void {
    this.store.retry();
  }
  responded(quotation: Quotation): void {
    this.store.updateSelected(quotation);
    this.responseSaved.set(true);
    afterNextRender(() => this.answerHeading()?.nativeElement.focus(), { injector: this.injector });
  }
  date(value: string): string {
    return new Intl.DateTimeFormat(this.market.locale(), {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  }
}
