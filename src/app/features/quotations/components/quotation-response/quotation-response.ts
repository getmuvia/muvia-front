import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { disabled, form, FormField, maxLength, submit, validate } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { Quotation, RespondQuotation, QUOTATION_LIMITS } from '@core/models/quotation/quotation';
import { QuotationService } from '@core/services/quotation/quotation.service';
import { I18nService, TranslationKey } from '@core/services/i18n/i18n';
import { TranslatePipe } from '@core/services/i18n/translation-pipes';

@Component({
  selector: 'app-quotation-response',
  imports: [FormField, TranslatePipe],
  templateUrl: './quotation-response.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuotationResponse {
  private readonly api = inject(QuotationService);
  private readonly i18n = inject(I18nService);
  private readonly injector = inject(Injector);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly quotation = input.required<Quotation>();
  readonly responded = output<Quotation>();
  readonly refresh = output<void>();
  readonly saving = signal(false);
  readonly error = signal<TranslationKey | null>(null);
  readonly draft = signal({
    status: 'QUOTED' as 'QUOTED' | 'DECLINED',
    price: 0,
    minDays: 0,
    maxDays: 0,
    message: '',
  });
  readonly fields = form(this.draft, (path) => {
    for (const field of [path.price, path.minDays, path.maxDays])
      disabled(field, { when: ({ valueOf }) => valueOf(path.status) !== 'QUOTED' });
    validate(path.price, ({ value }) =>
      value() > 0 &&
      value() <= QUOTATION_LIMITS.maximumPrice &&
      Math.abs(value() * 100 - Math.round(value() * 100)) < 0.000001
        ? null
        : { kind: 'price', message: this.i18n.t('quotations.invalidPrice') },
    );
    for (const field of [path.minDays, path.maxDays])
      validate(field, ({ value }) =>
        Number.isInteger(value()) &&
        value() > 0 &&
        value() <= QUOTATION_LIMITS.maximumProductionDays
          ? null
          : { kind: 'days', message: this.i18n.t('quotations.invalidDays') },
      );
    validate(path.maxDays, ({ value, valueOf }) =>
      value() >= valueOf(path.minDays)
        ? null
        : { kind: 'range', message: this.i18n.t('quotations.invalidDays') },
    );
    validate(path.message, ({ value }) =>
      value().trim()
        ? null
        : { kind: 'required', message: this.i18n.t('quotations.messageRequired') },
    );
    maxLength(path.message, QUOTATION_LIMITS.notesLength, {
      message: this.i18n.t('quotations.notesTooLong'),
    });
  });

  async send(event: Event): Promise<void> {
    event.preventDefault();
    if (this.saving()) return;
    const valid = await submit(this.fields, {
      action: async () => {
        this.saving.set(true);
        this.error.set(null);
        const value = this.draft();
        const response: RespondQuotation =
          value.status === 'QUOTED'
            ? {
                status: 'QUOTED',
                price: value.price,
                leadTimeMinDays: value.minDays,
                leadTimeMaxDays: value.maxDays,
                message: value.message.trim(),
              }
            : { status: 'DECLINED', message: value.message.trim() };
        try {
          this.responded.emit(
            await firstValueFrom(this.api.respond(this.quotation().id, response)),
          );
        } catch (error) {
          this.error.set(
            error instanceof HttpErrorResponse && error.status === 409
              ? 'quotations.alreadyAnswered'
              : 'quotations.responseFailed',
          );
        } finally {
          this.saving.set(false);
        }
      },
    });
    if (!valid) {
      afterNextRender(
        () => this.host.nativeElement.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
        { injector: this.injector },
      );
    }
  }
}
