import { CanDeactivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { SessaoService } from './sessao/sessao.service';
export interface PaginaEditavel {
  temAlteracoes?: () => boolean;
}
export const alteracoesPendentesGuard: CanDeactivateFn<PaginaEditavel> = (componente) =>
  !inject(SessaoService).autenticado() ||
  !componente.temAlteracoes?.() ||
  window.confirm('Há alterações não salvas. Deseja sair e descartá-las?');
