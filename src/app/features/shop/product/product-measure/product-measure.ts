import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  NgZone,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
  viewChild,
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
import {
  CameraStatus,
  SpatialMeasurementService,
  SpatialPoint,
  TrackingStatus,
} from '@core/services/measurement/spatial-measurement';
import { LoggerService } from '@core/services/logger/logger';
import { catchError, finalize, of } from 'rxjs';

type MeasurementStep = 'setup' | 'camera' | 'result';

@Component({
  selector: 'app-product-measure',
  imports: [],
  templateUrl: './product-measure.html',
  styleUrl: './product-measure.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductMeasure implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly ngZone = inject(NgZone);
  private readonly categoryService = inject(CategoryService);
  private readonly measurementService = inject(SpatialMeasurementService);
  private readonly logger = inject(LoggerService);

  readonly cameraCanvas = viewChild<ElementRef<HTMLCanvasElement>>('cameraCanvas');
  readonly dimensionOptions = PRODUCT_DIMENSIONS;
  readonly categories = signal<Category[]>([]);
  readonly isLoadingCategories = signal(true);
  readonly categoryError = signal<string | null>(null);
  readonly selectedCategoryCode = signal('');
  readonly selectedDimension = signal<ProductDimension>('width');
  readonly step = signal<MeasurementStep>('setup');
  readonly cameraStatus = signal<CameraStatus>('requesting');
  readonly trackingStatus = signal<TrackingStatus>('initializing');
  readonly cameraError = signal<string | null>(null);
  readonly firstPoint = signal<SpatialPoint | null>(null);
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
  readonly canUseCamera = computed(() => Boolean(this.selectedCategory()) && !this.isLoadingCategories());
  readonly canCapturePoint = computed(() =>
    this.cameraStatus() === 'ready' && this.trackingStatus() === 'normal',
  );
  readonly cameraInstruction = computed(() => {
    if (this.cameraError()) return this.cameraError();
    if (this.cameraStatus() === 'requesting') return 'Permite el acceso a la cámara para comenzar.';
    if (this.trackingStatus() === 'initializing') {
      return 'Mueve el teléfono lentamente para reconocer el espacio.';
    }
    if (this.trackingStatus() === 'limited') {
      return 'Busca una superficie con buena luz y detalles visibles.';
    }
    if (this.firstPoint()) {
      return 'Punto inicial guardado. Apunta al extremo final y vuelve a marcar.';
    }
    return 'Apunta el punto blanco al inicio de la distancia que quieres medir.';
  });
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

  ngOnDestroy(): void {
    this.measurementService.stop();
  }

  selectCategory(event: Event): void {
    this.selectedCategoryCode.set((event.target as HTMLSelectElement).value);
  }

  selectDimension(dimension: ProductDimension): void {
    this.selectedDimension.set(dimension);
  }

  async openCamera(): Promise<void> {
    if (!this.canUseCamera()) return;

    this.firstPoint.set(null);
    this.cameraError.set(null);
    this.cameraStatus.set('requesting');
    this.trackingStatus.set('initializing');
    this.step.set('camera');

    await this.waitForNextFrame();
    const canvas = this.cameraCanvas()?.nativeElement;
    if (!canvas) {
      this.showCameraError('No se pudo preparar la vista de la cámara.');
      return;
    }

    try {
      await this.measurementService.start(canvas, {
        onCameraStatus: (status) => this.ngZone.run(() => {
          this.cameraStatus.set(status);
          if (status === 'failed') {
            this.showCameraError('No se pudo acceder a la cámara. Revisa sus permisos.');
          }
        }),
        onTrackingStatus: (status) => this.ngZone.run(() => this.trackingStatus.set(status)),
      });
    } catch (error: unknown) {
      this.logger.error('Spatial measurement failed to start', error, 'ProductMeasure');
      this.showCameraError(this.getErrorMessage(error));
    }
  }

  capturePoint(): void {
    if (!this.canCapturePoint()) return;

    const point = this.measurementService.captureCenterPoint();
    if (!point) {
      this.cameraError.set('No detectamos una superficie en ese punto. Mueve el teléfono e inténtalo otra vez.');
      return;
    }

    this.cameraError.set(null);
    const startPoint = this.firstPoint();
    if (!startPoint) {
      this.firstPoint.set(point);
      return;
    }

    const measuredCentimeters = this.measurementService.distanceInCentimeters(startPoint, point);
    if (!Number.isFinite(measuredCentimeters) || measuredCentimeters < 1 || measuredCentimeters > 10000) {
      this.cameraError.set('La medición no fue válida. Marca los dos puntos otra vez.');
      this.firstPoint.set(null);
      return;
    }

    this.measurementInput.set((Math.round(measuredCentimeters * 10) / 10).toString());
    this.measurementService.stop();
    this.step.set('result');
  }

  useManualEntry(): void {
    this.measurementService.stop();
    this.cameraError.set(null);
    this.firstPoint.set(null);
    this.step.set('result');
  }

  updateMeasurement(event: Event): void {
    this.measurementInput.set((event.target as HTMLInputElement).value);
  }

  editSetup(): void {
    this.measurementService.stop();
    this.cameraError.set(null);
    this.firstPoint.set(null);
    this.step.set('setup');
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

  private showCameraError(message: string): void {
    this.cameraStatus.set('failed');
    this.cameraError.set(message);
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error
      ? error.message
      : 'No se pudo iniciar la medición con cámara.';
  }

  private waitForNextFrame(): Promise<void> {
    return new Promise((resolve) => requestAnimationFrame(() => resolve()));
  }
}
