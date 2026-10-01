import { Component, input } from '@angular/core';

@Component({
    selector: 'app-page-header',
    imports: [],
    templateUrl: './page-header.html',
    styleUrl: './page-header.css',
})
export class PageHeader {
    readonly title = input<string>('Muebles para tu espacio');
}
