import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { ToastService, Toast } from '@core/services/toast/toast';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [],
  template: `
    <div class="fixed bottom-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
      @for (toast of toastService.toasts(); track toast.id) {
        <div 
          class="pointer-events-auto min-w-[300px] max-w-md p-4 rounded-lg shadow-lg transform transition-all duration-300 animate-slide-in flex items-center justify-between"
          [class.bg-success]="toast.type === 'success'"
          [class.bg-error]="toast.type === 'error'"
          [class.bg-primary]="toast.type === 'info'"
          [class.bg-warning]="toast.type === 'warning'"
          [class.text-white]="toast.type !== 'warning'"
          [class.text-text-main]="toast.type === 'warning'"
        >
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-xl">
              @switch (toast.type) {
                @case ('success') { check_circle }
                @case ('error') { error }
                @case ('info') { info }
                @case ('warning') { warning }
              }
            </span>
            <p class="font-medium text-sm">{{ toast.message }}</p>
          </div>
          
          <button (click)="toastService.remove(toast.id)" class="ml-4 opacity-70 hover:opacity-100 transition-opacity">
            <span class="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: []
})
export class ToastContainer {
  readonly toastService = inject(ToastService);
}
