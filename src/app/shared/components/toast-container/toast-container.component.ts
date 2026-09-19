import { Component, inject } from '@angular/core';
import { ToastService } from '@core/services/toast/toast';

@Component({
  selector: 'app-toast-container',
  template: `
    <div class="pointer-events-none fixed bottom-4 left-4 right-4 z-[9999] flex flex-col items-end gap-3 sm:left-auto">
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          class="pointer-events-auto flex w-full max-w-md transform items-center justify-between rounded-panel p-4 shadow-lg transition-all duration-300 animate-slide-in sm:w-auto sm:min-w-[300px]"
          [class.bg-success]="toast.type === 'success'"
          [class.bg-error]="toast.type === 'error'"
          [class.bg-primary]="toast.type === 'info'"
          [class.bg-warning]="toast.type === 'warning'"
          [class.text-white]="toast.type !== 'warning'"
          [class.text-text-main]="toast.type === 'warning'"
          [attr.role]="toast.type === 'error' || toast.type === 'warning' ? 'alert' : 'status'"
          [attr.aria-live]="toast.type === 'error' || toast.type === 'warning' ? 'assertive' : 'polite'"
          aria-atomic="true"
        >
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-xl" aria-hidden="true">
              @switch (toast.type) {
                @case ('success') { check_circle }
                @case ('error') { error }
                @case ('info') { info }
                @case ('warning') { warning }
              }
            </span>
            <p class="font-medium text-sm">{{ toast.message }}</p>
          </div>
          
          <button type="button" (click)="toastService.remove(toast.id)" aria-label="Cerrar notificación"
            class="ml-3 flex size-11 shrink-0 items-center justify-center rounded-full opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current">
            <span class="material-symbols-outlined text-lg" aria-hidden="true">close</span>
          </button>
        </div>
      }
    </div>
  `,
  styles: []
})
export class ToastContainer {
  readonly toastService = inject(ToastService);
}
