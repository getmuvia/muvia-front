import { Component, input, output } from '@angular/core';

@Component({
    selector: 'app-load-more-button',
    imports: [],
    templateUrl: './load-more-button.html',
    styleUrl: './load-more-button.css',
})
export class LoadMoreButton {
    readonly isLoading = input<boolean>(false);
    readonly hasMore = input<boolean>(true);

    readonly loadMore = output<void>();

    onLoadMore(): void {
        if (!this.isLoading() && this.hasMore()) {
            this.loadMore.emit();
        }
    }
}
