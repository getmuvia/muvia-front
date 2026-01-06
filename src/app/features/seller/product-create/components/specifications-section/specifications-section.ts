import { Component, input } from '@angular/core';
import { Field, FieldTree } from '@angular/forms/signals';

@Component({
    selector: 'app-specifications-section',
    imports: [Field],
    templateUrl: './specifications-section.html',
    styleUrl: './specifications-section.css',
})
export class SpecificationsSection {
    weightField = input.required<FieldTree<string>>();
    materialField = input.required<FieldTree<string>>();
    colorField = input.required<FieldTree<string>>();

    dimensionWidthField = input.required<FieldTree<number>>();
    dimensionHeightField = input.required<FieldTree<number>>();
    dimensionDepthField = input.required<FieldTree<number>>();
    dimensionUnitField = input.required<FieldTree<string>>();

    isFieldInvalid(field: FieldTree<unknown>): boolean {
        const f = field as any;
        return f && f.touched && f.touched() && f.errors && f.errors().length > 0;
    }
    
    getFieldErrors(field: FieldTree<unknown>): { message: string }[] {
        const f = field as any;
        return (f.errors && f.errors()) || [];
    }
}
