import { Component, input, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'app-page-header',
    imports: [],
    templateUrl: './page-header.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    styleUrl: './page-header.css',
})
export class PageHeader {
    readonly subtitle = input<string>('Catálogo Muvia');
    readonly title = input<string>('Colección');
    readonly titleBold = input<string>('Completa');
    readonly description = input<string>('Diseño contemporáneo para la vida moderna. Encuentra la pieza perfecta que define tu estilo único.');
    readonly productCount = input<number>(0);
}
