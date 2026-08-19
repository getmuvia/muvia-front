import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'app-load-more-button',
    imports: [],
    templateUrl: './load-more-button.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './load-more-button.css',
})
export class LoadMoreButton {
    isLoading = input<boolean>(false);
    hasMore = input<boolean>(true);

    loadMore = output<void>();

    onLoadMore(): void {
        if (!this.isLoading() && this.hasMore()) {
            this.loadMore.emit();
        }
    }
}
