import { ApplicationConfig, ErrorHandler, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { authInterceptor } from '@core/auth/interceptors/auth.interceptor';
import { errorInterceptor } from '@core/interceptors/error.interceptor';
import { correlationInterceptor } from '@core/interceptors/correlation.interceptor';
import { GlobalErrorHandler } from '@core/observability/global-error-handler';
import { appInit } from '@core/auth/functions/app-init';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' })
    ),
    provideClientHydration(),
    provideHttpClient(withFetch(), withInterceptors([
      authInterceptor,
      correlationInterceptor,
      errorInterceptor,
    ])),
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    provideAppInitializer(appInit)
  ]
};
