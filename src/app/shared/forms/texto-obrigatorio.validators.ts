import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Mantém a semântica de `required` para que os componentes de mensagem existentes
 * possam informar a obrigatoriedade também quando o campo contiver apenas espaços.
 */
export function validarTextoObrigatorio(): ValidatorFn {
  return (controle: AbstractControl<string>): ValidationErrors | null =>
    controle.value.trim().length > 0 ? null : { required: true };
}
