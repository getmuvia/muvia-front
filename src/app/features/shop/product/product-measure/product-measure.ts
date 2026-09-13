import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { Category } from '@core/models/category/category';
import {
  PRODUCT_DIMENSIONS,
  ProductDimension,
  findProductDimension,
  formatDimensionCm,
  parseMaxDimensionCm,
} from '@core/models/product/product-dimension-filter';
import { CategoryService } from '@core/services/category/category';
import { LoggerService } from '@core/services/logger/logger';
import { catchError, finalize, of } from 'rxjs';

@Component({
  selector: 'app-product-measure',
  imports: [],
  templateUrl: './product-measure.html',
  styleUrl: './product-measure.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductMeasure implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly categoryService = inject(CategoryService);
  private readonly logger = inject(LoggerService);

  readonly dimensionOptions = PRODUCT_DIMENSIONS;
  readonly categories = signal<Category[]>([]);
  readonly isLoadingCategories = signal(true);
  readonly categoryError = signal<string | null>(null);
  readonly selectedCategoryCode = signal('');
  readonly selectedDimension = signal<ProductDimension>('width');
  readonly measurementInput = signal('');

  private readonly sourceSearch = (this.route.snapshot.queryParamMap.get('search') ?? '').trim();
  private readonly sourceCategory = this.route.snapshot.queryParamMap
    .get('category')?.trim().toUpperCase() ?? '';
  private readonly sourceDimension = findProductDimension(
    this.route.snapshot.queryParamMap.get('dimension'),
  );
  private readonly sourceMaximum = parseMaxDimensionCm(
    this.route.snapshot.queryParamMap.get('maxDimensionCm'),
  );

  readonly selectedCategory = computed(() => this.categories().find(
    ({ code }) => code === this.selectedCategoryCode(),
  ) ?? null);
  readonly dimensionDetails = computed(() => findProductDimension(this.selectedDimension()));
  readonly measurementValue = computed(() => parseMaxDimensionCm(this.measurementInput()));
  readonly resultSummary = computed(() => {
    const value = this.measurementValue();
    return value ? `${this.dimensionDetails()?.label} máximo: ${formatDimensionCm(value)} cm` : '';
  });

  ngOnInit(): void {
    if (this.sourceDimension) this.selectedDimension.set(this.sourceDimension.value);
    if (this.sourceMaximum) this.measurementInput.set(String(this.sourceMaximum));

    this.loadCategories();
  }

  retryCategories(): void {
    this.loadCategories();
  }

  selectCategory(event: Event): void {
    this.selectedCategoryCode.set((event.target as HTMLSelectElement).value);
  }

  selectDimension(dimension: ProductDimension): void {
    this.selectedDimension.set(dimension);
  }

  updateMeasurement(event: Event): void {
    this.measurementInput.set((event.target as HTMLInputElement).value);
  }

  searchProducts(): void {
    const category = this.selectedCategory();
    const maxDimensionCm = this.measurementValue();
    if (!category || !maxDimensionCm) return;

    this.router.navigate(['/products'], {
      queryParams: {
        search: this.sourceSearch || null,
        category: category.code,
        dimension: this.selectedDimension(),
        maxDimensionCm,
      },
    });
  }

  returnToProducts(): void {
    const hasSourceMeasurement = Boolean(
      this.sourceCategory && this.sourceDimension && this.sourceMaximum,
    );
    this.router.navigate(['/products'], {
      queryParams: {
        search: this.sourceSearch || null,
        category: this.sourceCategory || null,
        dimension: hasSourceMeasurement ? this.sourceDimension?.value : null,
        maxDimensionCm: hasSourceMeasurement ? this.sourceMaximum : null,
      },
    });
  }

  private loadCategories(): void {
    this.isLoadingCategories.set(true);
    this.categoryError.set(null);

    this.categoryService.getCategories().pipe(
      catchError((error: unknown) => {
        this.logger.error('Measurement categories failed to load', error, 'ProductMeasure');
        this.categoryError.set('No pudimos cargar las categorías. Inténtalo de nuevo.');
        return of([] as Category[]);
      }),
      finalize(() => this.isLoadingCategories.set(false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((categories) => {
      this.categories.set(categories);
      if (categories.length === 0 && !this.categoryError()) {
        this.categoryError.set('No hay categorías disponibles en este momento.');
      }
      const selectedCategory = categories.find(({ code }) => code === this.sourceCategory);
      this.selectedCategoryCode.set(selectedCategory?.code ?? '');
    });
  }
}
