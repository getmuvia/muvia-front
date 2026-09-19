import { TestBed } from '@angular/core/testing';

import { ToastService } from './toast';

describe('ToastService', () => {
    let service: ToastService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(ToastService);
    });

    it('deduplicates an identical active notification', () => {
        service.error('No pudimos cargar los productos.', 0);
        service.error('No pudimos cargar los productos.', 0);

        expect(service.toasts()).toHaveLength(1);
    });

    it('assigns stable unique identifiers without relying on timestamps', () => {
        service.info('Primer mensaje', 0);
        service.info('Segundo mensaje', 0);

        const [firstToast, secondToast] = service.toasts();
        expect(firstToast.id).not.toBe(secondToast.id);
    });

    it('allows the same notification after the active one is dismissed', () => {
        service.warning('Revisa la información.', 0);
        const [toast] = service.toasts();

        service.remove(toast.id);
        service.warning('Revisa la información.', 0);

        expect(service.toasts()).toHaveLength(1);
        expect(service.toasts()[0].id).not.toBe(toast.id);
    });
});
