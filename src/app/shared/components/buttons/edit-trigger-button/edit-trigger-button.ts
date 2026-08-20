import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-edit-trigger-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button (click)="click.emit()"
      class="absolute p-2 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-md text-white border border-white/20 shadow-lg transition-all transform hover:scale-105 active:scale-95 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center"
      [class]="customClass()"
      [attr.title]="tooltip()">
      <span class="material-symbols-outlined text-xl">{{ icon() }}</span>
    </button>
  `
})
export class EditTriggerButton {
  readonly icon = input<string>('photo_camera');
  readonly tooltip = input<string>('Editar');
  readonly customClass = input<string>('');
  readonly click = output<void>();
}
