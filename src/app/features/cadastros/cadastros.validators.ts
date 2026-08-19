import { ValidatorFn, Validators } from '@angular/forms';

import { CampoCadastro } from './cadastros.models';

export function obterValidadoresCampo(campo: CampoCadastro): ValidatorFn[] {
  const validadores: ValidatorFn[] = [];

  if (campo.obrigatorio) {
    validadores.push(Validators.required);
  }

  if (campo.tamanhoMaximo) {
    validadores.push(Validators.maxLength(campo.tamanhoMaximo));
  }

  return validadores;
}
