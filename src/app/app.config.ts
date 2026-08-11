import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  importProvidersFrom,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { provideRouter } from '@angular/router';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { catchError, firstValueFrom, Observable, of } from 'rxjs';
import { authInterceptor } from './core/api/interceptors/auth.interceptor';
import { refreshTokenInterceptor } from './core/api/interceptors/refresh-token.interceptor';
import { SubmissaoErrorStateMatcher } from './shared/forms/submissao-error-state.matcher';

import { routes } from './app.routes';

interface ServicoDeTraducaoInicial {
  use(idioma: string): Observable<unknown>;
}

export function carregarIdiomaInicial(translateService: ServicoDeTraducaoInicial): Promise<void> {
  return firstValueFrom(translateService.use('pt-BR').pipe(catchError(() => of(undefined)))).then(
    () => undefined,
  );
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor, refreshTokenInterceptor])),
    provideTranslateService({
      lang: 'pt-BR',
      fallbackLang: 'pt-BR',
      loader: provideTranslateHttpLoader({
        prefix: '/i18n/',
        suffix: '.json',
      }),
    }),
    provideAppInitializer(() => carregarIdiomaInicial(inject(TranslateService))),
    importProvidersFrom(MatSnackBarModule),
    { provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { appearance: 'outline' } },
    { provide: ErrorStateMatcher, useClass: SubmissaoErrorStateMatcher },
  ],
};
