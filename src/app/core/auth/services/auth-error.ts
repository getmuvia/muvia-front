import { HttpErrorResponse } from '@angular/common/http';

export function parseAuthError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
        const apiMessage = getApiMessage(error);

        switch (error.status) {
            case 401:
                return 'Credenciales inválidas';
            case 400:
                return apiMessage || 'Datos inválidos';
            case 409:
                return 'El usuario ya existe';
            case 0:
                return 'No se pudo conectar al servidor';
            default:
                return apiMessage || 'Error en la autenticación';
        }
    }
    return 'Error inesperado';
}

function getApiMessage(error: HttpErrorResponse): string | null {
    const message: unknown = error.error?.message;

    if (typeof message === 'string') {
        return message;
    }

    if (Array.isArray(message)) {
        const messages = message.filter((item): item is string => typeof item === 'string');
        return messages.length > 0 ? messages.join('. ') : null;
    }

    return null;
}
