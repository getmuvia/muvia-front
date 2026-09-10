import { Component, computed, input, output } from '@angular/core';

@Component({
  selector: 'app-pagination',
  imports: [],
  templateUrl: './pagination.html',
  styleUrl: './pagination.css',
})
export class Pagination {
  readonly currentPage = input<number>(1);
  readonly totalPages = input<number>(1);

  readonly pageChange = output<number>();

  readonly visiblePages = computed(() => {
    const current = this.currentPage();
    const total = this.totalPages();
    const pages: (number | string)[] = [];

    if (total <= 5) {
      for (let page = 1; page <= total; page++) {
        pages.push(page);
      }
    } else {
      pages.push(1);
      if (current > 3) {
        pages.push('...');
      }
      for (let page = Math.max(2, current - 1); page <= Math.min(total - 1, current + 1); page++) {
        if (!pages.includes(page)) {
          pages.push(page);
        }
      }
      if (current < total - 2) {
        pages.push('...');
      }
      if (!pages.includes(total)) {
        pages.push(total);
      }
    }

    return pages;
  });

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages() && page !== this.currentPage()) {
      this.pageChange.emit(page);
    }
  }

  previousPage(): void {
    this.goToPage(this.currentPage() - 1);
  }

  nextPage(): void {
    this.goToPage(this.currentPage() + 1);
  }
}
