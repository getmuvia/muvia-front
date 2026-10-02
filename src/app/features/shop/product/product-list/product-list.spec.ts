import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { BehaviorSubject, Observable, Subject, of, throwError } from 'rxjs';

import { PaginatedResponse, ProductService } from '@core/services/product/product';
import { ProductSummary } from '@core/models/product/product-summary';
import { HybridSearchResponse } from '@core/models/search/hybrid-search.model';
import { HybridSearchService } from '@core/services/search/hybrid-search';
import { CategoryService } from '@core/services/category/category';
import { Category } from '@core/models/category/category';
import { MarketService } from '@core/services/market/market';
import { ProductList } from './product-list';

describe('ProductList', () => {
  let component: ProductList;
  let fixture: ComponentFixture<ProductList>;
  const categories: Category[] = [
    {
      id: 'desk-id',
      code: 'DESK',
      name: 'Escritorios',
      parentId: null,
      description: '',
      imageUrl: '',
      level: 1,
      isSelectable: true,
    },
    {
      id: 'chair-id',
      code: 'CHAIR',
      name: 'Sillas',
      parentId: null,
      description: '',
      imageUrl: '',
      level: 1,
      isSelectable: true,
    },
    {
      id: 'divan-id',
      code: 'DIVAN',
      name: 'Divanes',
      parentId: null,
      description: '',
      imageUrl: '',
      level: 1,
      isSelectable: true,
    },
  ];
  const getCategories = vi.fn((): Observable<Category[]> => of(categories));
  const emptyPage: PaginatedResponse<ProductSummary> = {
    data: [], total: 0, page: 1, limit: 10, totalPages: 0,
  };
  const searchProducts = vi.fn((): Observable<PaginatedResponse<ProductSummary>> => of(emptyPage));
  const hybridSearch = vi.fn((): Observable<HybridSearchResponse> => of({
    query: '', interpretation: { summary: '', source: 'ai' }, results: [], count: 0,
  }));
  let queryParams: BehaviorSubject<ReturnType<typeof convertToParamMap>>;

  beforeEach(async () => {
    getCategories.mockReset().mockReturnValue(of(categories));
    searchProducts.mockReset().mockReturnValue(of(emptyPage));
    hybridSearch.mockReset().mockReturnValue(of({
      query: '', interpretation: { summary: '', source: 'ai' }, results: [], count: 0,
    }));
    queryParams = new BehaviorSubject(convertToParamMap({}));
    await TestBed.configureTestingModule({
      imports: [ProductList],
      providers: [
        { provide: CategoryService, useValue: { getCategories } },
        { provide: ProductService, useValue: { searchProducts } },
        { provide: HybridSearchService, useValue: { search: hybridSearch } },
      ],
    }).compileComponents();
    vi.spyOn(TestBed.inject(ActivatedRoute), 'queryParamMap', 'get').mockReturnValue(queryParams);
    fixture = TestBed.createComponent(ProductList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders fallback products in a separately labeled section', () => {
    hybridSearch.mockReturnValue(of({
      query: 'silla', interpretation: { summary: '', source: 'ai' }, results: [], count: 0,
      relatedResults: [{
        id: 'fallback-chair', title: 'Silla ergonómica', description: null,
        price: 1500, currencyCode: 'BOB', imageUrl: null, score: 0.4, matchType: 'lexical',
      }],
    }));
    queryParams.next(convertToParamMap({ search: 'silla' }));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Otros productos que te podrían interesar');
    expect(fixture.nativeElement.textContent).toContain('Silla ergonómica');
  });

  it('renders the interpretation returned for a completed smart search', () => {
    hybridSearch.mockReturnValue(of({
      query: 'escritorio de madera',
      interpretation: { summary: 'Escritorio · Madera', source: 'ai' }, results: [], count: 0,
    }));
    queryParams.next(convertToParamMap({ search: 'escritorio de madera' }));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Muvia entendió');
    expect(fixture.nativeElement.textContent).toContain('Escritorio · Madera');
  });

  it('writes a refined natural-language query to the URL', () => {
    const navigateSpy = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    component.onRefineSearch('quiero un escritorio de 100 cm de alto');

    expect(navigateSpy).toHaveBeenCalledWith(
      [],
      expect.objectContaining({
        queryParams: { search: 'quiero un escritorio de 100 cm de alto' },
        queryParamsHandling: 'merge',
      }),
    );
  });

  it('adds an explicitly submitted detail to the current search context', () => {
    const navigateSpy = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    queryParams.next(convertToParamMap({ search: 'quiero un escritorio' }));

    component.onSearchSubmit('que sea de madera y en L');

    expect(navigateSpy).toHaveBeenCalledWith(
      [],
      expect.objectContaining({
        queryParams: {
          search: 'quiero un escritorio, que sea de madera y en L',
        },
        queryParamsHandling: 'merge',
      }),
    );
  });

  it('switches category without keeping measurements from the previous category', () => {
    const navigateSpy = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    queryParams.next(convertToParamMap({ category: 'DESK' }));

    const select = fixture.nativeElement.querySelector('#catalog-category') as HTMLSelectElement;
    select.value = 'CHAIR';
    select.dispatchEvent(new Event('change'));

    expect(navigateSpy).toHaveBeenCalledWith(
      [],
      expect.objectContaining({
        queryParams: { category: 'CHAIR', dimension: null, maxDimensionCm: null },
        queryParamsHandling: 'merge',
      }),
    );
  });

  it('clears the category through the all-products control', () => {
    const navigateSpy = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    queryParams.next(convertToParamMap({ category: 'DESK' }));
    fixture.detectChanges();

    const select = fixture.nativeElement.querySelector('#catalog-category') as HTMLSelectElement;
    expect(select.value).toBe('DESK');
    select.value = '';
    select.dispatchEvent(new Event('change'));

    expect(navigateSpy).toHaveBeenCalledWith(
      [],
      expect.objectContaining({
        queryParams: { category: null, dimension: null, maxDimensionCm: null },
        queryParamsHandling: 'merge',
      }),
    );
  });

  it('does not restart the search when the active category is selected again', () => {
    const navigateSpy = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    queryParams.next(convertToParamMap({ category: 'DESK' }));

    component.onSelectCategory('DESK');

    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('loads every returned category in alphabetical order', () => {
    expect(component.catalog.categories().map((category) => category.name)).toEqual([
      'Divanes',
      'Escritorios',
      'Sillas',
    ]);
    expect(getCategories).toHaveBeenCalledOnce();
  });

  it('starts the product request while the category selector is still loading', async () => {
    fixture.destroy();
    const pendingCategories = new Subject<Category[]>();
    getCategories.mockClear().mockReturnValue(pendingCategories);
    searchProducts.mockClear();
    fixture = TestBed.createComponent(ProductList);
    component = fixture.componentInstance;
    await fixture.whenStable();

    expect(component.catalog.isLoadingCategories()).toBe(true);
    expect(searchProducts).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, marketCode: 'BO' }),
      { errorFeedback: 'local' },
    );
    expect(component.catalog.displayLoading()).toBe(false);
  });

  it('uses one category request for the selector, URL resolution, and later searches', async () => {
    fixture.destroy();
    const params = new BehaviorSubject(convertToParamMap({ category: 'DIVAN' }));
    vi.spyOn(TestBed.inject(ActivatedRoute), 'queryParamMap', 'get').mockReturnValue(
      params.asObservable(),
    );
    const pendingCategories = new Subject<Category[]>();
    getCategories.mockClear().mockReturnValue(pendingCategories);
    searchProducts.mockClear();
    fixture = TestBed.createComponent(ProductList);
    component = fixture.componentInstance;
    await fixture.whenStable();

    expect(searchProducts).not.toHaveBeenCalled();
    pendingCategories.next(categories);
    await fixture.whenStable();
    expect(getCategories).toHaveBeenCalledOnce();
    expect(searchProducts).toHaveBeenCalledWith(
      expect.objectContaining({ categoryId: 'divan-id' }),
      { errorFeedback: 'local' },
    );
    expect(
      (fixture.nativeElement.querySelector('#catalog-category') as HTMLSelectElement).value,
    ).toBe('DIVAN');

    params.next(convertToParamMap({ category: 'DIVAN', search: 'madera' }));
    await fixture.whenStable();
    expect(getCategories).toHaveBeenCalledOnce();
    expect(searchProducts).toHaveBeenLastCalledWith(
      expect.objectContaining({ categoryId: 'divan-id', search: 'madera' }),
      { errorFeedback: 'local' },
    );
  });

  it('retries a failed category list without restarting the unfiltered product request', async () => {
    fixture.destroy();
    getCategories.mockClear().mockReturnValue(throwError(() => new Error('Unavailable')));
    searchProducts.mockClear();
    fixture = TestBed.createComponent(ProductList);
    component = fixture.componentInstance;
    await fixture.whenStable();

    expect(component.catalog.categoryListError()).toBeTruthy();
    expect(component.catalog.displayError()).toBeNull();
    expect(searchProducts).toHaveBeenCalledOnce();
    getCategories.mockReturnValue(of(categories));
    (
      fixture.nativeElement.querySelector('app-category-filter button') as HTMLButtonElement
    ).click();
    await fixture.whenStable();

    expect(getCategories).toHaveBeenCalledTimes(2);
    expect(component.catalog.categoryListError()).toBeNull();
    expect(component.catalog.categories()).toHaveLength(3);
    expect(searchProducts).toHaveBeenCalledOnce();
  });

  it('recovers a category-filtered URL after retrying a failed category request', async () => {
    fixture.destroy();
    vi.spyOn(TestBed.inject(ActivatedRoute), 'queryParamMap', 'get').mockReturnValue(
      of(convertToParamMap({ category: 'DIVAN' })),
    );
    getCategories.mockClear().mockReturnValue(throwError(() => new Error('Unavailable')));
    searchProducts.mockClear();
    fixture = TestBed.createComponent(ProductList);
    component = fixture.componentInstance;
    await fixture.whenStable();

    expect(component.catalog.categoryResolutionError()).toBeTruthy();
    expect(searchProducts).not.toHaveBeenCalled();
    getCategories.mockReturnValue(of(categories));
    component.catalog.retryProducts();
    await fixture.whenStable();

    expect(getCategories).toHaveBeenCalledTimes(2);
    expect(component.catalog.categoryResolutionError()).toBeNull();
    expect(searchProducts).toHaveBeenCalledWith(
      expect.objectContaining({ categoryId: 'divan-id' }),
      { errorFeedback: 'local' },
    );
  });

  it('does not broaden an unknown category URL into an unfiltered search', async () => {
    fixture.destroy();
    vi.spyOn(TestBed.inject(ActivatedRoute), 'queryParamMap', 'get').mockReturnValue(
      of(convertToParamMap({ category: 'UNKNOWN' })),
    );
    searchProducts.mockClear();
    fixture = TestBed.createComponent(ProductList);
    component = fixture.componentInstance;
    await fixture.whenStable();

    expect(component.catalog.categoryResolutionError()).toBeTruthy();
    expect(searchProducts).not.toHaveBeenCalled();
    expect(
      (fixture.nativeElement.querySelector('#catalog-category') as HTMLSelectElement)
        .selectedOptions[0].textContent,
    ).toContain('Categoría no disponible');
  });

  it('preserves search and category context when opening the measurement tool', () => {
    const navigateSpy = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    queryParams.next(convertToParamMap({
      search: 'madera', category: 'DESK', dimension: 'width', maxDimensionCm: '120',
    }));
    component.onMeasureRequested();
    expect(navigateSpy).toHaveBeenCalledWith(['/products/measure'], {
      queryParams: { search: 'madera', category: 'DESK', dimension: 'width', maxDimensionCm: 120 },
    });
  });

  it('clears measurement filters while retaining the search and category in the URL', () => {
    const navigateSpy = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    queryParams.next(convertToParamMap({
      search: 'madera', category: 'DESK', dimension: 'width', maxDimensionCm: '120',
    }));
    component.onClearMeasurement();
    expect(navigateSpy).toHaveBeenCalledWith([], expect.objectContaining({
      queryParams: { search: 'madera', dimension: null, maxDimensionCm: null },
      queryParamsHandling: 'merge',
    }));
  });

  it('waits for the current market categories and ignores the previous pending response', async () => {
    fixture.destroy();
    vi.spyOn(TestBed.inject(ActivatedRoute), 'queryParamMap', 'get').mockReturnValue(
      of(convertToParamMap({ category: 'DESK' })),
    );
    const previousCategories = new Subject<Category[]>();
    const currentCategories = new Subject<Category[]>();
    getCategories
      .mockReset()
      .mockReturnValueOnce(previousCategories)
      .mockReturnValue(currentCategories);
    searchProducts.mockClear();
    fixture = TestBed.createComponent(ProductList);
    component = fixture.componentInstance;
    await fixture.whenStable();

    const market = TestBed.inject(MarketService);
    market.selectMarket({
      ...market.selectedMarket(),
      code: 'PE',
      name: 'Perú',
      defaultLocale: 'es-PE',
    });
    await fixture.whenStable();
    previousCategories.next(categories);
    expect(searchProducts).not.toHaveBeenCalled();
    expect(component.catalog.isLoadingCategories()).toBe(true);

    currentCategories.next([{ ...categories[0], id: 'current-desk-id' }]);
    await fixture.whenStable();
    expect(getCategories).toHaveBeenCalledTimes(2);
    expect(searchProducts).toHaveBeenCalledWith(
      expect.objectContaining({ categoryId: 'current-desk-id', marketCode: 'PE' }),
      { errorFeedback: 'local' },
    );
  });
});
