import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { FormField, FieldTree } from '@angular/forms/signals';
import { Category } from '@core/models/category/category';

@Component({
    selector: 'app-basic-info-section',
    imports: [FormField],
    templateUrl: './basic-info-section.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    styleUrl: './basic-info-section.css',
})
export class BasicInfoSection {
    readonly titleField = input.required<FieldTree<string>>();
    readonly descriptionField = input.required<FieldTree<string>>();
    readonly priceField = input.required<FieldTree<number>>();
    readonly stockField = input.required<FieldTree<number>>();
    readonly categoryIdField = input.required<FieldTree<string>>();

    readonly categories = input<Category[]>([]);
    readonly isLoadingCategories = input(false);

    isFieldInvalid(field: FieldTree<unknown>): boolean {
        const state = field();
        return state.touched() && state.errors().length > 0;
    }

    getFieldErrors(field: FieldTree<unknown>): { message: string }[] {
        return field().errors().map(error => ({
            message: error.message ?? 'Campo inválido'
        }));
    }
}
