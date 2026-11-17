import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { FormField, form, maxLength, submit, validate } from '@angular/forms/signals';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '@core/auth/services/auth';
import type { Product } from '@core/models/product/product';
import { resolveProductPrice } from '@core/models/product/product-price';
import {
  QUOTATION_AXES,
  QUOTATION_LIMITS,
  QUOTATION_UNIT_CM,
} from '@core/models/quotation/quotation';
import {
  dimensionPrecisionValid,
  quotationDimensions,
  validQuotationMeasurement,
} from '@core/models/quotation/quotation-dimensions';
import { TranslatePipe } from '@core/services/i18n/translation-pipes';
import { I18nService, type TranslationKey } from '@core/services/i18n/i18n';
import { MarketService } from '@core/services/market/market';
import { QuotationService } from '@core/services/quotation/quotation.service';
import { ProductPrice } from '@shared/components/product-price/product-price';
import { DimensionComparison } from '@features/quotations/components/dimension-comparison/dimension-comparison';
import { PublishedDimensions } from '../published-dimensions/published-dimensions';

interface DimensionDraft {
  width: number;
  depth: number;
  height: number;
  notes: string;
}

@Component({
  selector: 'app-dimension-studio',
  imports: [FormField, TranslatePipe, ProductPrice, PublishedDimensions, DimensionComparison],
  templateUrl: './dimension-studio.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block scroll-mt-6', id: 'dimension-studio' },
})
export class DimensionStudio {
  private readonly api = inject(QuotationService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly i18n = inject(I18nService);
  private readonly injector = inject(Injector);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly market = inject(MarketService);
  readonly product = input.required<Product>();
  readonly heading = viewChild<ElementRef<HTMLElement>>('heading');
  readonly user = this.auth.currentUser;
  readonly axes = QUOTATION_AXES;
  readonly limits = QUOTATION_LIMITS;
  readonly base = computed(() => quotationDimensions(this.product().specifications?.dimensions)!);
  readonly factor = computed(
    () => QUOTATION_UNIT_CM[this.base().unit as keyof typeof QUOTATION_UNIT_CM],
  );
  readonly range = computed(() => ({
    min: QUOTATION_LIMITS.minimumDimensionCm / this.factor(),
    max: QUOTATION_LIMITS.maximumDimensionCm / this.factor(),
    unit: this.base().unit,
  }));
  readonly referencePrice = computed(() =>
    resolveProductPrice(this.product(), this.market.selectedMarket().code),
  );
  readonly ownProduct = computed(() => this.user()?.id === this.product().sellerId);
  readonly draft = linkedSignal(() => this.initialDraft());
  readonly reviewOpen = signal(false);
  readonly sending = signal(false);
  readonly error = signal<TranslationKey | null>(null);
  private attempt: { fingerprint: string; requestId: string } | null = null;

  readonly fields = form(this.draft, (path) => {
    for (const { key } of QUOTATION_AXES) {
      validate(path[key], ({ value }) =>
        validQuotationMeasurement(value(), this.factor()) && dimensionPrecisionValid(value())
          ? null
          : { kind: 'dimension', message: this.i18n.t('quotations.invalidDimension') },
      );
    }
    maxLength(path.notes, QUOTATION_LIMITS.notesLength, {
      message: this.i18n.t('quotations.notesTooLong'),
    });
  });
  readonly requested = computed(() => ({
    width: this.draft().width,
    depth: this.draft().depth,
    height: this.draft().height,
    unit: this.base().unit,
  }));
  readonly diagram = computed(() => quotationDimensions(this.requested()) ?? this.base());

  constructor() {
    this.focusHeading();
    effect(() => {
      if (!this.user()) {
        untracked(() => {
          this.draft.update((draft) => ({ ...draft, notes: '' }));
          this.reviewOpen.set(false);
          this.attempt = null;
        });
      }
    });
  }

  reset(): void {
    const { width, depth, height } = this.base();
    this.fields().reset({ width, depth, height, notes: this.draft().notes });
    this.error.set(null);
  }
  edit(): void {
    this.reviewOpen.set(false);
    this.error.set(null);
    this.focusHeading();
  }

  async review(event: Event): Promise<void> {
    event.preventDefault();
    if (this.ownProduct()) return;
    const valid = await submit(this.fields, {
      action: async () => {
        if (!this.user()) {
          const returnUrl = this.router.serializeUrl(
            this.router.createUrlTree(['/products', this.product().id], {
              queryParams: { quote: '1', ...this.requested() },
            }),
          );
          await this.router.navigate(['/auth/login'], { queryParams: { returnUrl } });
          return;
        }
        this.reviewOpen.set(true);
        this.error.set(null);
        this.focusHeading();
      },
    });
    if (!valid) {
      afterNextRender(
        () => this.host.nativeElement.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
        { injector: this.injector },
      );
    }
  }

  async send(): Promise<void> {
    if (
      this.sending() ||
      !this.reviewOpen() ||
      !this.user() ||
      this.fields().invalid() ||
      this.ownProduct()
    )
      return;
    const details = {
      productId: this.product().id,
      marketCode: this.market.selectedMarket().code,
      dimensions: this.requested(),
      notes: this.draft().notes.trim(),
    };
    const fingerprint = JSON.stringify(details);
    if (this.attempt?.fingerprint !== fingerprint)
      this.attempt = { fingerprint, requestId: crypto.randomUUID() };
    this.sending.set(true);
    this.error.set(null);
    try {
      const quotation = await firstValueFrom(
        this.api.create({ ...details, requestId: this.attempt!.requestId }),
      );
      await this.router.navigate(['/quotations', quotation.id], { queryParams: { created: '1' } });
    } catch (error) {
      this.error.set(
        error instanceof HttpErrorResponse && error.status === 409
          ? 'quotations.productChanged'
          : 'quotations.sendFailed',
      );
    } finally {
      this.sending.set(false);
    }
  }

  private focusHeading(): void {
    afterNextRender(() => this.heading()?.nativeElement.focus(), { injector: this.injector });
  }

  private initialDraft(): DimensionDraft {
    const base = this.base();
    const params = this.route.snapshot.queryParamMap;
    const candidate = {
      ...base,
      ...Object.fromEntries(
        QUOTATION_AXES.map(({ key }) => [
          key,
          params.has(key) ? Number(params.get(key)) : base[key],
        ]),
      ),
    };
    const initial = quotationDimensions(candidate) ?? base;
    return { width: initial.width, depth: initial.depth, height: initial.height, notes: '' };
  }
}
