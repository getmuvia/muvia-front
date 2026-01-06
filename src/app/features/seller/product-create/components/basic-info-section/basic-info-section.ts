import { Component, input } from '@angular/core';
import { Field, FieldTree } from '@angular/forms/signals';
import { Category } from '@core/models/category/category';

@Component({
    selector: 'app-basic-info-section',
    imports: [Field],
    templateUrl: './basic-info-section.html',
    styleUrl: './basic-info-section.css',
})
export class BasicInfoSection {
    titleField = input.required<FieldTree<string>>();
    descriptionField = input.required<FieldTree<string>>();
    priceField = input.required<FieldTree<number>>();
    stockField = input.required<FieldTree<number>>();
    categoryIdField = input.required<FieldTree<string>>();

    categories = input<Category[]>([]);
    isLoadingCategories = input(false);

    isFieldInvalid(field: FieldTree<unknown>): boolean {
        const f = field as any;
        return f && f.touched && f.touched() && f.errors && f.errors().length > 0;
    }

    getFieldErrors(field: FieldTree<unknown>): { message: string }[] {
        const f = field as any;
        return (f.errors && f.errors()) || [];
    }
}
