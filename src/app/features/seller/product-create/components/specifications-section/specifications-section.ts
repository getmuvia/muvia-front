import { Component, input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
    selector: 'app-specifications-section',
    imports: [ReactiveFormsModule],
    templateUrl: './specifications-section.html',
    styleUrl: './specifications-section.css',
})
export class SpecificationsSection {
    form = input.required<FormGroup>();
}
