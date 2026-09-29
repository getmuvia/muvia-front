import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { API_ENDPOINTS } from '@core/constants/api-endpoints';
import { HybridSearchResponse } from '@core/models/search/hybrid-search.model';
import { MarketService } from '@core/services/market/market';
import { HybridSearchService } from './hybrid-search';

describe('HybridSearchService', () => {
  let service: HybridSearchService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        HybridSearchService,
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: MarketService,
          useValue: {
            selectedMarket: signal({ code: 'BO' }),
            locale: signal('es-BO'),
          },
        },
      ],
    });

    service = TestBed.inject(HybridSearchService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('sends the query with the active market and locale', () => {
    const response: HybridSearchResponse = {
      query: 'escritorio de madera',
      interpretation: {
        summary: 'Escritorio · Madera',
        source: 'ai',
      },
      results: [],
      count: 0,
      relatedResults: [],
    };

    service.search('escritorio de madera', 10).subscribe(result => {
      expect(result).toEqual(response);
    });

    const request = httpTesting.expectOne(API_ENDPOINTS.AI.HYBRID_SEARCH);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      query: 'escritorio de madera',
      limit: 10,
      marketCode: 'BO',
      locale: 'es-BO',
    });
    request.flush(response);
  });
});
