import { Component, input, effect } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Category } from '@core/models/category/category';

@Component({
    selector: 'app-basic-info-section',
    imports: [ReactiveFormsModule],
    templateUrl: './basic-info-section.html',
    styleUrl: './basic-info-section.css',
})
export class BasicInfoSection {
    form = input.required<FormGroup>();
    categories = input<Category[]>([]);
    isLoadingCategories = input(false);
    constructor() {
        effect(() => {
            const control = this.form().get('categoryId');
            if (control) {
                this.isLoadingCategories() ? control.disable() : control.enable();
            }
        });
    }
}
