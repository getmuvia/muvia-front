import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { Observable, retry, timer } from 'rxjs';
import { Category } from '@core/models/category/category';
import { API_ENDPOINTS } from '@core/constants/api-endpoints';
import { SILENT_HTTP_ERRORS } from '@core/interceptors/error.interceptor';
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
      context: new HttpContext().set(SILENT_HTTP_ERRORS, true),
      params: new HttpParams().set('locale', this.marketService.locale()),
    }).pipe(
      retry({
        count: 2,
        delay: (_error, retryCount) => timer(retryCount * 750),
      }),
    );
  }
}
