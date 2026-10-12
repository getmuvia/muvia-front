import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ToastService } from '@core/services/toast/toast';
import { ToastContainer } from './toast-container.component';
import { I18nService } from '@core/services/i18n/i18n';

describe('ToastContainer', () => {
    afterEach(() => localStorage.removeItem('muvia.language'));
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

    it('changes an already visible safe error and its dismiss label when the language changes', () => {
        toastService.error('Debes iniciar sesión para continuar.', 0);
        fixture.detectChanges();
        TestBed.inject(I18nService).selectLanguage('en');
        fixture.detectChanges();

        expect(fixture.nativeElement.textContent).toContain('You must sign in to continue.');
        expect(fixture.nativeElement.querySelector('button').getAttribute('aria-label')).toBe('Dismiss notification');
        expect(toastService.toasts()).toHaveLength(1);
        expect(toastService.toasts()[0].message).toBe('Debes iniciar sesión para continuar.');
    });
});
