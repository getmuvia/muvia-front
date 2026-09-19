import { HttpErrorResponse } from '@angular/common/http';

import { getErrorMessage, toAppError } from './api-error.model';

describe('toAppError', () => {
    it('classifies network failures as retryable', () => {
        const error = new HttpErrorResponse({ status: 0, statusText: 'Unknown Error' });

        expect(toAppError(error)).toEqual({
            kind: 'network',
            message: 'No pudimos conectarnos al servidor. Verifica tu conexión e inténtalo nuevamente.',
            status: 0,
            code: null,
            retryable: true,
        });
    });

    it('masks unreviewed backend messages', () => {
        const error = new HttpErrorResponse({
            status: 500,
            error: { message: 'Database connection refused at internal-host:5432' },
        });

        const normalized = toAppError(error);

        expect(normalized.kind).toBe('server');
        expect(normalized.retryable).toBe(true);
        expect(normalized.message).toBe(
            'El servicio no está disponible en este momento. Inténtalo nuevamente.',
        );
        expect(normalized.message).not.toContain('Database');
    });

    it('translates reviewed backend messages', () => {
        const error = new HttpErrorResponse({
            status: 409,
            error: { message: 'Email has already been registered' },
        });

        expect(toAppError(error).message).toBe('El correo electrónico ya está registrado.');
    });

    it('maps stable backend codes without exposing raw text', () => {
        const error = new HttpErrorResponse({
            status: 409,
            error: {
                code: 'PRODUCT_LIMIT_REACHED',
                message: 'Seller exceeded MAX_PRODUCTS_PER_SELLER',
            },
        });

        expect(toAppError(error, {
            codeMessages: {
                PRODUCT_LIMIT_REACHED: 'Alcanzaste el límite de productos permitidos.',
            },
        })).toMatchObject({
            kind: 'conflict',
            code: 'PRODUCT_LIMIT_REACHED',
            message: 'Alcanzaste el límite de productos permitidos.',
            retryable: false,
        });
    });

    it('supports contextual fallbacks without returning unknown validation details', () => {
        const error = new HttpErrorResponse({
            status: 400,
            error: { message: ['price must be a positive number', 'internalRule must match'] },
        });

        expect(getErrorMessage(error, 'No se pudo guardar el producto.')).toBe(
            'No se pudo guardar el producto.',
        );
    });

    it('supports status-specific presentation policies', () => {
        const error = new HttpErrorResponse({ status: 401 });

        expect(getErrorMessage(error, {
            fallbackMessage: 'Error al iniciar sesión.',
            statusMessages: { 401: 'Credenciales inválidas.' },
        })).toBe('Credenciales inválidas.');
    });
});
