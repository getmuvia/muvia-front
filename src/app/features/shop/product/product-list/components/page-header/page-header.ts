import { Component, input, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'app-page-header',
    imports: [],
    templateUrl: './page-header.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './page-header.css',
})
export class PageHeader {
    subtitle = input<string>('Catálogo 2024');
    title = input<string>('Colección');
    titleBold = input<string>('Completa');
    description = input<string>('Diseño contemporáneo para la vida moderna. Encuentra la pieza perfecta que define tu estilo único.');
    productCount = input<number>(0);
}
