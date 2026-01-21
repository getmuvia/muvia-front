import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
    id: number;
    message: string;
    type: ToastType;
    duration?: number;
}

@Injectable({
    providedIn: 'root'
})
export class ToastService {
    readonly toasts = signal<Toast[]>([]);

    show(message: string, type: ToastType = 'info', duration = 3000): void {
        const id = Date.now();
        const toast: Toast = { id, message, type, duration };

        this.toasts.update(current => [...current, toast]);

        if (duration > 0) {
            setTimeout(() => this.remove(id), duration);
        }
    }

    success(message: string, duration = 3000): void {
        this.show(message, 'success', duration);
    }

    error(message: string, duration = 4000): void {
        this.show(message, 'error', duration);
    }

    info(message: string, duration = 3000): void {
        this.show(message, 'info', duration);
    }

    warning(message: string, duration = 3000): void {
        this.show(message, 'warning', duration);
    }

    remove(id: number): void {
        this.toasts.update(current => current.filter(t => t.id !== id));
    }
}
