import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ToastService } from '@core/services/toast/toast';
import { ToastContainer } from './toast-container.component';

describe('ToastContainer', () => {
    let fixture: ComponentFixture<ToastContainer>;
    let toastService: ToastService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ToastContainer],
        }).compileComponents();

        fixture = TestBed.createComponent(ToastContainer);
        toastService = TestBed.inject(ToastService);
    });

    it('announces errors assertively and exposes an accessible dismiss button', () => {
        toastService.error('No pudimos guardar los cambios.', 0);
        fixture.detectChanges();

        const alert = fixture.nativeElement.querySelector('[role="alert"]') as HTMLElement;
        const dismissButton = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

        expect(alert).toBeTruthy();
        expect(alert.getAttribute('aria-live')).toBe('assertive');
        expect(alert.getAttribute('aria-atomic')).toBe('true');
        expect(dismissButton.getAttribute('aria-label')).toBe('Cerrar notificación');
        expect(dismissButton.type).toBe('button');
    });

    it('announces informational feedback politely', () => {
        toastService.success('Cambios guardados.', 0);
        fixture.detectChanges();

        const status = fixture.nativeElement.querySelector('[role="status"]') as HTMLElement;
        expect(status.getAttribute('aria-live')).toBe('polite');
    });
});
