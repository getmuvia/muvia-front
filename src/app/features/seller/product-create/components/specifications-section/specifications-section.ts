import { Component, Input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
    selector: 'app-specifications-section',
    imports: [ReactiveFormsModule],
    templateUrl: './specifications-section.html',
    styleUrl: './specifications-section.css',
})
export class SpecificationsSection {
    @Input({ required: true }) form!: FormGroup;
}
