import { HttpErrorResponse } from '@angular/common/http';

/**
 * Error payload returned by the API. Every property is optional because error
 * responses from proxies and third-party services may use a different shape.
 */
export interface ApiError {
    message?: string | string[];
    statusCode?: number;
    error?: string;
    code?: string;
}

export type AppErrorKind =
    | 'network'
    | 'authentication'
    | 'authorization'
    | 'validation'
    | 'not-found'
    | 'conflict'
    | 'rate-limit'
    | 'server'
    | 'unknown';

/**
 * Stable error contract used by UI presentation and application state.
 */
export interface AppError {
    kind: AppErrorKind;
    message: string;
    status: number | null;
    code: string | null;
    retryable: boolean;
}

export interface NormalizeErrorOptions {
    fallbackMessage?: string;
    statusMessages?: Readonly<Partial<Record<number, string>>>;
    codeMessages?: Readonly<Record<string, string>>;
}

const DEFAULT_MESSAGES: Readonly<Record<AppErrorKind, string>> = {
    network: 'No pudimos conectarnos al servidor. Verifica tu conexión e inténtalo nuevamente.',
    authentication: 'Debes iniciar sesión para continuar.',
    authorization: 'No tienes permiso para realizar esta acción.',
    validation: 'Revisa los datos ingresados e inténtalo nuevamente.',
    'not-found': 'El recurso solicitado no está disponible.',
    conflict: 'No pudimos completar la acción porque la información ya existe o cambió.',
    'rate-limit': 'Has realizado demasiadas solicitudes. Espera un momento e inténtalo nuevamente.',
    server: 'El servicio no está disponible en este momento. Inténtalo nuevamente.',
    unknown: 'Ocurrió un error inesperado. Inténtalo nuevamente.',
};

/**
 * Only explicitly reviewed backend messages may reach the UI. Unknown backend
 * text is intentionally replaced to avoid leaking technical or English copy.
 */
const KNOWN_BACKEND_MESSAGES: Readonly<Record<string, string>> = {
    'Invalid credentials': 'Credenciales inválidas.',
    'Email has already been registered': 'El correo electrónico ya está registrado.',
    'Invalid current password': 'La contraseña actual es incorrecta.',
    'Complete the vendor business location before creating products':
        'Completa la ubicación de tu negocio antes de crear productos.',
    'You do not have permission to modify this product':
        'No tienes permiso para modificar este producto.',
    'File type not allowed.': 'El tipo de archivo seleccionado no está permitido.',
};

/**
 * Converts any caught value into the error contract used by the application.
 * It never exposes an unreviewed backend or JavaScript error message.
 */
export function toAppError(error: unknown, options: NormalizeErrorOptions = {}): AppError {
    if (isAppError(error)) {
        return error;
    }

    const httpError = error instanceof HttpErrorResponse ? error : null;
    const status = httpError?.status ?? null;
    const kind = classifyError(status);
    const body = httpError ? readApiError(httpError.error) : null;
    const code = getErrorCode(body);
    const backendMessages = getBackendMessages(body);

    const message = getStatusMessage(options.statusMessages, status)
        ?? getCodeMessage(code, options.codeMessages)
        ?? getKnownBackendMessage(backendMessages)
        ?? options.fallbackMessage
        ?? DEFAULT_MESSAGES[kind];

    return {
        kind,
        message,
        status,
        code,
        retryable: kind === 'network' || kind === 'rate-limit' || kind === 'server',
    };
}

/**
 * Compatibility helper for existing state that only stores a message.
 */
export function getErrorMessage(
    error: unknown,
    fallbackOrOptions?: string | NormalizeErrorOptions,
): string {
    const options = typeof fallbackOrOptions === 'string'
        ? { fallbackMessage: fallbackOrOptions }
        : fallbackOrOptions;

    return toAppError(error, options).message;
}

function classifyError(status: number | null): AppErrorKind {
    if (status === 0 || status === 408) return 'network';
    if (status === 400 || status === 422) return 'validation';
    if (status === 401) return 'authentication';
    if (status === 403) return 'authorization';
    if (status === 404) return 'not-found';
    if (status === 409) return 'conflict';
    if (status === 429) return 'rate-limit';
    if (status !== null && status >= 500) return 'server';
    return 'unknown';
}

function readApiError(body: unknown): ApiError | null {
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
        return null;
    }

    return body as ApiError;
}

function getBackendMessages(body: ApiError | null): string[] {
    if (typeof body?.message === 'string') {
        return [body.message];
    }

    if (Array.isArray(body?.message)) {
        return body.message.filter((message): message is string => typeof message === 'string');
    }

    return [];
}

function getErrorCode(body: ApiError | null): string | null {
    if (typeof body?.code === 'string' && body.code.trim()) {
        return body.code.trim().toUpperCase();
    }

    if (typeof body?.error === 'string' && /^[A-Z][A-Z0-9_]+$/.test(body.error)) {
        return body.error;
    }

    return null;
}

function getStatusMessage(
    statusMessages: NormalizeErrorOptions['statusMessages'],
    status: number | null,
): string | null {
    if (status === null) return null;
    return statusMessages?.[status] ?? null;
}

function getCodeMessage(
    code: string | null,
    codeMessages: NormalizeErrorOptions['codeMessages'],
): string | null {
    if (!code) return null;
    return codeMessages?.[code] ?? null;
}

function getKnownBackendMessage(messages: string[]): string | null {
    for (const message of messages) {
        const translatedMessage = KNOWN_BACKEND_MESSAGES[message];
        if (translatedMessage) return translatedMessage;
    }

    return null;
}

function isAppError(error: unknown): error is AppError {
    if (typeof error !== 'object' || error === null) return false;

    const candidate = error as Partial<AppError>;
    return typeof candidate.kind === 'string'
        && typeof candidate.message === 'string'
        && typeof candidate.retryable === 'boolean'
        && (typeof candidate.status === 'number' || candidate.status === null)
        && (typeof candidate.code === 'string' || candidate.code === null);
}
