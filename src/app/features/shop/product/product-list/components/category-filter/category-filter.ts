import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Category } from '@core/models/category/category';

@Component({
  selector: 'app-category-filter',
  templateUrl: './category-filter.html',
  styleUrl: './category-filter.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryFilter {
  readonly categories = input<readonly Category[]>([]);
  readonly selectedCode = input('');
  readonly isLoading = input(false);
  readonly error = input<string | null>(null);
  readonly selectCategory = output<string>();
  readonly retry = output<void>();

  readonly hasUnavailableSelection = computed(
    () =>
      !!this.selectedCode() &&
      !this.categories().some((category) => category.code === this.selectedCode()),
  );

  onSelectionChange(event: Event): void {
    this.selectCategory.emit((event.target as HTMLSelectElement).value);
  }
}
