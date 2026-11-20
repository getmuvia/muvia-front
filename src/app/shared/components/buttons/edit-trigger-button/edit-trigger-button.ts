import { UiTextPipe } from '@core/services/i18n/translation-pipes';
import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-edit-trigger-button',
  imports: [UiTextPipe],
  standalone: true,
  template: `
    <button
      (click)="click.emit()"
      class="absolute p-2 rounded-full bg-ink hover:bg-paper hover:text-ink backdrop-blur-md text-canvas border border-canvas transition-all transform hover:scale-105 active:scale-95 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center"
      [class]="customClass()"
      [attr.title]="tooltip() | uiText"
      [attr.aria-label]="tooltip() | uiText"
    >
      <span class="material-symbols-outlined icon-lg">{{ icon() }}</span>
    </button>
  `,
})
export class EditTriggerButton {
  readonly icon = input<string>('photo_camera');
  readonly tooltip = input<string>('Editar');
  readonly customClass = input<string>('');
  readonly click = output<void>();
}
