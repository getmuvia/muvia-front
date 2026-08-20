import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { FormField, FieldTree } from '@angular/forms/signals';

@Component({
    selector: 'app-specifications-section',
    imports: [FormField],
    templateUrl: './specifications-section.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    styleUrl: './specifications-section.css',
})
export class SpecificationsSection {
    readonly weightField = input.required<FieldTree<string>>();
    readonly materialField = input.required<FieldTree<string>>();
    readonly colorField = input.required<FieldTree<string>>();

    readonly dimensionWidthField = input.required<FieldTree<number>>();
    readonly dimensionHeightField = input.required<FieldTree<number>>();
    readonly dimensionDepthField = input.required<FieldTree<number>>();
    readonly dimensionUnitField = input.required<FieldTree<string>>();

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
