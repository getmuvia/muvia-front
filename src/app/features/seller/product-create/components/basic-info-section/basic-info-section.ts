import { Component, input } from '@angular/core';
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
}
