import { Component, input, output, computed, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'app-seller-pagination',
    imports: [],
    templateUrl: './seller-pagination.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './seller-pagination.css',
})
export class SellerPagination {
    currentPage = input<number>(1);
    totalPages = input<number>(1);

    pageChange = output<number>();

    visiblePages = computed(() => {
        const current = this.currentPage();
        const total = this.totalPages();
        const pages: (number | string)[] = [];

        if (total <= 5) {
            for (let i = 1; i <= total; i++) {
                pages.push(i);
            }
        } else {
            pages.push(1);
            if (current > 3) {
                pages.push('...');
            }
            for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
                if (!pages.includes(i)) {
                    pages.push(i);
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
