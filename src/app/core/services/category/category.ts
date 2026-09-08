import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Category } from '@core/models/category/category';
import { API_ENDPOINTS } from '@core/constants/api-endpoints';
import { HttpParams } from '@angular/common/http';
import { MarketService } from '@core/services/market/market';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = API_ENDPOINTS.CATEGORIES.BASE;
  private readonly marketService = inject(MarketService);

  /**
   * Get all categories.
   */
  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(API_ENDPOINTS.CATEGORIES.SELECTABLE, {
      params: new HttpParams().set('locale', this.marketService.locale()),
    });
  }
}
