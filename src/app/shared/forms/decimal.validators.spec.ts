import { FormControl, Validators } from '@angular/forms';

import {
  converterDecimalParaNumero,
  formatarDecimalParaCampo,
  validarDecimalPositivo,
} from './decimal.validators';

describe('validarDecimalPositivo', () => {
  it('aceita valores positivos com vírgula ou ponto e até duas casas decimais', () => {
    const controle = new FormControl('12,50', {
      nonNullable: true,
      validators: [validarDecimalPositivo()],
    });

    expect(controle.errors).toBeNull();

    controle.setValue('0.01');
    expect(controle.errors).toBeNull();
  });

  it('deixa o campo vazio para o validador required e rejeita valores inválidos', () => {
    const controle = new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, validarDecimalPositivo()],
    });

    expect(controle.hasError('required')).toBe(true);
    expect(controle.hasError('decimalPositivo')).toBe(false);

    controle.setValue('0');
    expect(controle.hasError('decimalPositivo')).toBe(true);

    controle.setValue('1.234');
    expect(controle.hasError('decimalPositivo')).toBe(true);
  });

  it('converte somente valores decimais válidos no momento do envio', () => {
    expect(converterDecimalParaNumero('2500,75')).toBe(2500.75);
    expect(converterDecimalParaNumero('0')).toBeNull();
    expect(converterDecimalParaNumero('12,345')).toBeNull();
    expect(formatarDecimalParaCampo(2500.75)).toBe('2500.75');
  });
});
