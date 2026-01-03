import { HttpErrorResponse } from '@angular/common/http';

export function parseAuthError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
        switch (error.status) {
            case 401:
                return 'Credenciales inválidas';
            case 400:
                return error.error?.message || 'Datos inválidos';
            case 409:
                return 'El usuario ya existe';
            case 0:
                return 'No se pudo conectar al servidor';
            default:
                return error.error?.message || 'Error en la autenticación';
        }
    }
    return 'Error inesperado';
}
