import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  effect,
  inject,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '@core/services/i18n/translation-pipes';
import { MarketService } from '@core/services/market/market';
import {
  QUOTATION_STATUS_LABELS,
  QuotationView,
  isUnreadQuotation,
} from '@core/models/quotation/quotation';
import { QuotationStore } from '@core/services/quotation/quotation.store';
import { AuthService } from '@core/auth/services/auth';

@Component({
  selector: 'app-quotation-list',
  imports: [RouterLink, TranslatePipe],
  providers: [QuotationStore],
  templateUrl: './quotation-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuotationList {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly query = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });
  private readonly data = toSignal(this.route.data, { initialValue: this.route.snapshot.data });
  private readonly market = inject(MarketService);
  readonly store = inject(QuotationStore);
  readonly view = computed<QuotationView>(() =>
    this.data()['view'] === 'received' ? 'received' : 'sent',
  );
  readonly page = computed(() => {
    const page = Number(this.query().get('page'));
    return Number.isSafeInteger(page) && page > 0 ? page : 1;
  });
  readonly statuses = QUOTATION_STATUS_LABELS;
  private readonly sessionUserId = computed(() => this.auth.currentUser()?.id ?? null);
  readonly unread = isUnreadQuotation;
  readonly baseRoute = computed(() =>
    this.view() === 'received' ? '/seller/quotations' : '/quotations',
  );
  constructor() {
    effect(() => {
      if (this.sessionUserId()) {
        this.store.loadList(this.view(), this.page());
      } else {
        this.store.clear();
        void this.router.navigate(['/auth/login'], {
          queryParams: { returnUrl: this.router.url },
          replaceUrl: true,
        });
      }
    });
  }
  @HostListener('window:focus') refresh(): void {
    this.store.retry();
  }
  goTo(page: number): void {
    void this.router.navigate([], { relativeTo: this.route, queryParams: { page } });
  }
  date(value: string): string {
    return new Intl.DateTimeFormat(this.market.locale(), { dateStyle: 'medium' }).format(
      new Date(value),
    );
  }
}
