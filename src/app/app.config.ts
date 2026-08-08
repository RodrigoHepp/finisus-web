import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  importProvidersFrom,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { provideRouter } from '@angular/router';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { authInterceptor } from './core/api/interceptors/auth.interceptor';
import { refreshTokenInterceptor } from './core/api/interceptors/refresh-token.interceptor';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor, refreshTokenInterceptor])),
    importProvidersFrom(MatSnackBarModule),
    { provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { appearance: 'outline' } },
  ],
};
