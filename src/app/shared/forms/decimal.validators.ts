import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

const FORMATO_DECIMAL = /^\d+(?:[.,]\d{1,2})?$/;

/**
 * Valida valores monetários sem arredondá-los nem calculá-los no formulário.
 * A conversão para o contrato HTTP só acontece no envio.
 */
export function validarDecimalPositivo(): ValidatorFn {
  return (controle: AbstractControl<string>): ValidationErrors | null => {
    const valor = controle.value.trim();

    if (!valor) {
      return null;
    }

    return converterDecimalParaNumero(valor) === null ? { decimalPositivo: true } : null;
  };
}

export function converterDecimalParaNumero(valor: string): number | null {
  const valorNormalizado = valor.trim().replace(',', '.');

  if (!FORMATO_DECIMAL.test(valorNormalizado)) {
    return null;
  }

  const numero = Number(valorNormalizado);
  return Number.isFinite(numero) && numero > 0 ? numero : null;
}

export function formatarDecimalParaCampo(valor: number): string {
  return Number.isFinite(valor) && valor > 0 ? String(valor) : '';
}
