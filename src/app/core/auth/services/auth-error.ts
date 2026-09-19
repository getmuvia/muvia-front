import { getErrorMessage } from '@core/models/errors/api-error.model';

export function parseAuthError(error: unknown): string {
    return getErrorMessage(error, {
        fallbackMessage: 'Error en la autenticación.',
        statusMessages: {
            0: 'No se pudo conectar al servidor.',
            400: 'Revisa los datos ingresados.',
            401: 'Credenciales inválidas.',
            409: 'El usuario ya existe.',
        },
    });
}
