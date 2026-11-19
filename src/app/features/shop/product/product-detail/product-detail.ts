import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  effect,
  inject,
  input,
  linkedSignal,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subject, catchError, map, of, switchMap } from 'rxjs';
import type { ProductSummary } from '@core/models/product/product-summary';
import { CategoryNamePipe, TranslatePipe, UiTextPipe } from '@core/services/i18n/translation-pipes';
import { ProductStore } from '@core/services/product/product.store';
import { I18nService, type TranslationKey } from '@core/services/i18n/i18n';
import { quotationDimensions } from '@core/models/quotation/quotation-dimensions';
import { ImageGallery, ProductOverview, SimilarProducts } from './components';
import { DimensionStudio } from './components/dimension-studio/dimension-studio';

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
  private readonly route = inject(ActivatedRoute);
  private readonly i18n = inject(I18nService);
  private readonly similarProductRequests = new Subject<SimilarProductRequest | null>();

  readonly id = input.required<string>();
  readonly product = this.productStore.selectedEntity;
  readonly isLoading = this.productStore.isLoading;
  readonly error = computed(() => this.productStore.error()?.message ?? null);
  readonly canRetry = computed(() => this.productStore.error()?.retryable ?? false);
  readonly similarProducts = signal<ProductSummary[]>([]);
  readonly studioOpen = linkedSignal({
    source: this.id,
    computation: () => this.route.snapshot.queryParamMap.get('quote') === '1',
  });
  readonly shareFeedback = linkedSignal<string | undefined, TranslationKey | null>({
    source: () => this.product()?.id,
    computation: () => null,
  });
  readonly canCustomize = computed(
    () =>
      this.product()?.acceptsCustomDimensions === true &&
      !!quotationDimensions(this.product()?.specifications?.dimensions),
  );

  openStudio(): void {
    if (!this.canCustomize()) return;
    this.studioOpen.set(true);
    this.host.nativeElement.querySelector<HTMLElement>('#dimension-studio-title')?.focus();
  }


  async shareProduct(): Promise<void> {
    const product = this.product();
    if (!product || typeof navigator === 'undefined') return;

    const shareData = {
      title: `${product.title} · Muvia`,
      text: this.i18n.t('catalog.shareText', { title: product.title }),
      url: `https://app.getmuvia.com/products/${product.id}`,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        this.shareFeedback.set('catalog.productShared');
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareData.url);
        this.shareFeedback.set('catalog.productLinkCopied');
      } else {
        this.shareFeedback.set('catalog.productShareUnavailable');
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      this.shareFeedback.set('catalog.productShareFailed');
    }
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
