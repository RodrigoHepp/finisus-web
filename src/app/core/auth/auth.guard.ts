import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';

import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.restaurarSessao().pipe(
    map((sessaoRestaurada) => {
      if (sessaoRestaurada) {
        return true;
      }

      return router.createUrlTree(['/login'], {
        queryParams: {
          retorno: state.url,
        },
      });
    }),
  );
};
