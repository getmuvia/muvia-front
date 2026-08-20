import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'app-load-more-button',
    imports: [],
    templateUrl: './load-more-button.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
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
