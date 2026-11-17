import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { API_ENDPOINTS } from '@core/constants/api-endpoints';
import { createHttpErrorFeedbackContext } from '@core/models/errors/http-error-feedback';
import {
  CreateQuotation,
  Quotation,
  QuotationPage,
  QuotationView,
  RespondQuotation,
  QUOTATION_LIMITS,
} from '@core/models/quotation/quotation';

@Injectable({ providedIn: 'root' })
export class QuotationService {
  private readonly http = inject(HttpClient);
  private readonly base = API_ENDPOINTS.QUOTATIONS.BASE;
  private context() {
    return createHttpErrorFeedbackContext('local', { expectedStatuses: [400, 403, 404, 409] });
  }

  create(body: CreateQuotation) {
    return this.http.post<Quotation>(this.base, body, { context: this.context() });
  }

  list(view: QuotationView, page = 1) {
    const params = new HttpParams()
      .set('view', view)
      .set('page', page)
      .set('limit', QUOTATION_LIMITS.pageSize);
    return this.http.get<QuotationPage>(this.base, {
      params,
      context: this.context(),
      transferCache: false,
    });
  }

  get(id: string) {
    return this.http.get<Quotation>(`${this.base}/${id}`, {
      context: this.context(),
      transferCache: false,
    });
  }

  respond(id: string, body: RespondQuotation) {
    return this.http.patch<Quotation>(`${this.base}/${id}/response`, body, {
      context: this.context(),
    });
  }

  markRead(id: string, respondedAt: string | null) {
    return this.http.post<void>(
      `${this.base}/${id}/read`,
      { respondedAt },
      { context: this.context() },
    );
  }
}
