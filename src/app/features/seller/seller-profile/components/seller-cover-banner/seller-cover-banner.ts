import { Component, computed, input, output, ChangeDetectionStrategy } from '@angular/core';
import { EditTriggerButton } from '@shared/components/buttons/edit-trigger-button/edit-trigger-button';

@Component({
    selector: 'app-seller-cover-banner',
    imports: [EditTriggerButton],
    changeDetection: ChangeDetectionStrategy.Eager,
    templateUrl: './seller-cover-banner.html'
})
export class SellerCoverBanner {
    coverImage = input<string | null>(null);
    edit = output<void>();

    coverImageUrl = computed(() => {
        return this.coverImage();
    });
}
