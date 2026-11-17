import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subject, catchError, map, of, switchMap } from 'rxjs';
import type { ProductSummary } from '@core/models/product/product-summary';
import { CategoryNamePipe, TranslatePipe, UiTextPipe } from '@core/services/i18n/translation-pipes';
import { ProductStore } from '@core/services/product/product.store';
import { ImageGallery, ProductInfo, ProductOverview, SimilarProducts } from './components';
import { DimensionStudio } from './components/dimension-studio/dimension-studio';
import { quotationDimensions } from '@core/models/quotation/quotation-dimensions';

interface SimilarProductRequest {
  categoryId: string;
  excludeId: string;
}

const SIMILAR_PRODUCT_LIMIT = 4;

@Component({
  selector: 'app-product-detail',
  imports: [
    CategoryNamePipe,
    TranslatePipe,
    UiTextPipe,
    RouterLink,
    ImageGallery,
    ProductInfo,
    ProductOverview,
    SimilarProducts,
    DimensionStudio,
  ],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.css',
  providers: [ProductStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetail {
  private readonly destroyRef = inject(DestroyRef);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly productStore = inject(ProductStore);
  private readonly similarProductRequests = new Subject<SimilarProductRequest | null>();

  readonly id = input.required<string>();
  readonly product = this.productStore.selectedEntity;
  readonly isLoading = this.productStore.isLoading;
  readonly error = computed(() => this.productStore.error()?.message ?? null);
  readonly canRetry = computed(() => this.productStore.error()?.retryable ?? false);
  readonly similarProducts = signal<ProductSummary[]>([]);
  readonly studioOpen = signal(inject(ActivatedRoute).snapshot.queryParamMap.get('quote') === '1');
  readonly canCustomize = computed(
    () =>
      this.product()?.acceptsCustomDimensions &&
      !!quotationDimensions(this.product()?.specifications?.dimensions),
  );

  openStudio(): void {
    this.studioOpen.set(true);
    this.host.nativeElement.querySelector<HTMLElement>('#dimension-studio-title')?.focus();
  }

  constructor() {
    this.observeSimilarProducts();
    effect(() => this.loadProduct(this.id()));
    effect(() => {
      const product = this.product();
      this.loadSimilarProducts(product?.categoryId ?? '', product?.id ?? '');
    });
  }

  loadProduct(id: string): void {
    this.productStore.getProductById(id);
  }

  retryProduct(): void {
    if (!this.isLoading() && this.canRetry()) this.loadProduct(this.id());
  }

  loadSimilarProducts(categoryId: string, excludeId: string): void {
    this.similarProducts.set([]);
    this.similarProductRequests.next(categoryId ? { categoryId, excludeId } : null);
  }

  private observeSimilarProducts(): void {
    this.similarProductRequests
      .pipe(
        switchMap((request) => (request ? this.fetchSimilarProducts(request) : of([]))),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((products) => this.similarProducts.set(products));
  }

  private fetchSimilarProducts({ categoryId, excludeId }: SimilarProductRequest) {
    return this.productStore
      .getAllProducts({
        page: 1,
        limit: SIMILAR_PRODUCT_LIMIT + 1,
        search: '',
        categoryId,
      })
      .pipe(
        map((response) =>
          response.data
            .filter((product) => product.id !== excludeId)
            .slice(0, SIMILAR_PRODUCT_LIMIT),
        ),
        catchError(() => of([])),
      );
  }
}
