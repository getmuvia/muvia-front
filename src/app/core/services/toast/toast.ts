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
    private nextId = 0;

    show(message: string, type: ToastType = 'info', duration = 3000): void {
        const normalizedMessage = message.trim();
        if (!normalizedMessage) return;

        const isDuplicate = this.toasts().some(toast =>
            toast.type === type && toast.message === normalizedMessage
        );
        if (isDuplicate) return;

        const id = ++this.nextId;
        const toast: Toast = { id, message: normalizedMessage, type, duration };

        this.toasts.update(current => [...current, toast]);

        if (duration > 0) {
            setTimeout(() => this.remove(id), duration);
        }
    }

    success(message: string, duration = 4000): void {
        this.show(message, 'success', duration);
    }

    error(message: string, duration = 6000): void {
        this.show(message, 'error', duration);
    }

    info(message: string, duration = 4000): void {
        this.show(message, 'info', duration);
    }

    warning(message: string, duration = 6000): void {
        this.show(message, 'warning', duration);
    }

    remove(id: number): void {
        this.toasts.update(current => current.filter(t => t.id !== id));
    }
}
