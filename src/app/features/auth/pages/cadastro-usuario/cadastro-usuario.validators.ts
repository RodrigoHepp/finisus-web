import { AbstractControl, ValidationErrors } from '@angular/forms';

export function senhasCoincidem(controle: AbstractControl): ValidationErrors | null {
  const senha = controle.get('senha')?.value;
  const confirmacaoSenha = controle.get('confirmacaoSenha')?.value;

  return senha === confirmacaoSenha ? null : { senhasDiferentes: true };
}
