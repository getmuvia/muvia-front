import { HttpErrorResponse } from '@angular/common/http';

/**
 * Standard API error response structure from the backend.
 */
export interface ApiError {
    message: string;
    statusCode: number;
    error?: string;
}

/**
 * Extracts a user-friendly error message from an HTTP error.
 * Handles both API error responses and network errors.
 */
export function getErrorMessage(error: HttpErrorResponse, fallback: string = 'An unexpected error occurred'): string {
    // API error with message in body
    if (error.error?.message) {
        return error.error.message;
    }

    // String error body
    if (typeof error.error === 'string') {
        return error.error;
    }

    // Network or unknown error
    if (error.status === 0) {
        return 'No connection to server';
    }

    return fallback;
}
