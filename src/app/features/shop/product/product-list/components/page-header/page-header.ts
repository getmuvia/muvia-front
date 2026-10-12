import { TranslatePipe, UiTextPipe } from '@core/services/i18n/translation-pipes';
import { Component, input } from '@angular/core';

@Component({
    selector: 'app-page-header',
    imports: [TranslatePipe, UiTextPipe],
    templateUrl: './page-header.html',
    styleUrl: './page-header.css',
})
export class PageHeader {
    readonly title = input<string>('Muebles para tu espacio');
}
