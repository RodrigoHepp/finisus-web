import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { AuthService } from '../../auth/auth.service';
import { environment } from '../../../environment/environment';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const authService = inject(AuthService);

  const pertenceApi = request.url.startsWith(environment.apiUrl);

  const rotaLogin = `${environment.apiUrl}/auth/login`;
  const rotaRefresh = `${environment.apiUrl}/auth/refresh`;

  const rotaPublica = request.url === rotaLogin || request.url === rotaRefresh;

  const accessToken = authService.accessToken();

  if (!pertenceApi || rotaPublica || !accessToken) {
    return next(request);
  }

  const requisicaoAutenticada = request.clone({
    setHeaders: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return next(requisicaoAutenticada);
};
