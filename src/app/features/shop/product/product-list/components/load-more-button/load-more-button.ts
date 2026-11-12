import { TranslatePipe } from '@core/services/i18n/translation-pipes';
import { Component, input, output } from '@angular/core';

@Component({
    selector: 'app-load-more-button',
    imports: [TranslatePipe],
    templateUrl: './load-more-button.html',
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
