import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, retry, timer } from 'rxjs';
import { Category } from '@core/models/category/category';
import { API_ENDPOINTS } from '@core/constants/api-endpoints';
import { createHttpErrorFeedbackContext } from '@core/models/errors/http-error-feedback';
import { MarketService } from '@core/services/market/market';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private readonly http = inject(HttpClient);
  private readonly marketService = inject(MarketService);

  /**
   * Get all categories.
   */
  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(API_ENDPOINTS.CATEGORIES.SELECTABLE, {
      context: createHttpErrorFeedbackContext('none'),
      params: new HttpParams().set('locale', this.marketService.locale()),
    }).pipe(
      retry({
        count: 2,
        delay: (_error, retryCount) => timer(retryCount * 750),
      }),
    );
  }
}
