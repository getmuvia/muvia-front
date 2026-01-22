import { Injectable, inject, isDevMode } from '@angular/core';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
    level: LogLevel;
    message: string;
    context?: string;
    timestamp: Date;
    data?: unknown;
}

/**
 * LoggerService
 * Centralized logging service with environment-aware behavior.
 * 
 * - Development: Logs to console with colors
 * - Production: Silent by default (can be extended to send to Sentry, LogRocket, etc.)
 */
@Injectable({ providedIn: 'root' })
export class LoggerService {
    private readonly isProduction = !isDevMode();

    private readonly levelColors: Record<LogLevel, string> = {
        debug: '#9E9E9E',
        info: '#2196F3',
        warn: '#FF9800',
        error: '#F44336'
    };

    /**
     * Log a debug message (only in development)
     */
    debug(message: string, data?: unknown, context?: string): void {
        this.log('debug', message, data, context);
    }

    /**
     * Log an info message
     */
    info(message: string, data?: unknown, context?: string): void {
        this.log('info', message, data, context);
    }

    /**
     * Log a warning message
     */
    warn(message: string, data?: unknown, context?: string): void {
        this.log('warn', message, data, context);
    }

    /**
     * Log an error message
     */
    error(message: string, error?: unknown, context?: string): void {
        this.log('error', message, error, context);

        // In production, we could send to an external service
        if (this.isProduction) {
            this.sendToExternalService({ level: 'error', message, data: error, context, timestamp: new Date() });
        }
    }

    private log(level: LogLevel, message: string, data?: unknown, context?: string): void {
        // Skip debug logs in production
        if (this.isProduction && level === 'debug') {
            return;
        }

        const entry: LogEntry = {
            level,
            message,
            context,
            timestamp: new Date(),
            data
        };

        // In development, log to console with formatting
        if (!this.isProduction) {
            this.logToConsole(entry);
        }
    }

    private logToConsole(entry: LogEntry): void {
        const color = this.levelColors[entry.level];
        const prefix = entry.context ? `[${entry.context}]` : '';
        const time = entry.timestamp.toISOString().substring(11, 23);

        const style = `color: ${color}; font-weight: bold;`;
        const message = `%c${time} ${entry.level.toUpperCase()} ${prefix} ${entry.message}`;

        switch (entry.level) {
            case 'debug':
                entry.data !== undefined
                    ? console.debug(message, style, entry.data)
                    : console.debug(message, style);
                break;
            case 'info':
                entry.data !== undefined
                    ? console.info(message, style, entry.data)
                    : console.info(message, style);
                break;
            case 'warn':
                entry.data !== undefined
                    ? console.warn(message, style, entry.data)
                    : console.warn(message, style);
                break;
            case 'error':
                entry.data !== undefined
                    ? console.error(message, style, entry.data)
                    : console.error(message, style);
                break;
        }
    }

    /**
     * Placeholder for external logging service integration
     * Can be extended to send logs to Sentry, LogRocket, Datadog, etc.
     */
    private sendToExternalService(entry: LogEntry): void {
        // TODO: Integrate with external logging service
        // Example: Sentry.captureException(entry.data);
    }
}
