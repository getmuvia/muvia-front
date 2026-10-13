import { TranslatePipe } from '@core/services/i18n/translation-pipes';
import { Component, computed, input, output, signal } from '@angular/core';
import { EditTriggerButton } from '@shared/components/buttons/edit-trigger-button/edit-trigger-button';

@Component({
    selector: 'app-seller-cover-banner',
    imports: [TranslatePipe, EditTriggerButton],
    templateUrl: './seller-cover-banner.html'
})
export class SellerCoverBanner {
    readonly coverImage = input<string | null>(null);
    readonly editable = input(true);
    private readonly failedImage = signal<string | null>(null);
    readonly edit = output<void>();

    coverImageUrl = computed(() => {
        const image = this.coverImage();
        return image && image !== this.failedImage() ? image : null;
    });

    onImageError(): void {
        this.failedImage.set(this.coverImage());
    }
}
