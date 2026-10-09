import { ApplicationConfig, provideBrowserGlobalErrorListeners, LOCALE_ID } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import pt from '@angular/common/locales/pt';
import { URL_BASE_API } from './infraestrutura/api/configuracao-api';
import { sessaoInterceptor } from './infraestrutura/sessao/sessao.interceptor';
import { environment } from '../environment';
import { ErrorStateMatcher } from '@angular/material/core';
import { EstadoErroFormulario } from './shared/estado-erro-formulario';
registerLocaleData(pt);
import { provideRouter } from '@angular/router';

import { rotas } from './app.routes';

function removerBarrasFinais(url: string): string {
  let fim = url.length;
  while (fim > 0 && url[fim - 1] === '/') fim--;
  return url.slice(0, fim);
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(rotas),
    provideHttpClient(withInterceptors([sessaoInterceptor])),
    { provide: URL_BASE_API, useValue: removerBarrasFinais(environment.urlApi) },
    { provide: LOCALE_ID, useValue: 'pt-BR' },
    { provide: ErrorStateMatcher, useClass: EstadoErroFormulario },
  ],
};
