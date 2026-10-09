import { FormControl, FormRecord } from '@angular/forms';
import { configurarFormularioCompromisso, ValorCampo } from './formulario-compromisso';

describe('Entradas das intenções de compromissos', () => {
  let formulario: FormRecord<FormControl<ValorCampo>>;
  beforeEach(() => {
    formulario = new FormRecord<FormControl<ValorCampo>>({});
  });
  it('preserva valor omitido no pagamento para decisão do servidor e rejeita principal negativo', () => {
    configurarFormularioCompromisso(formulario, 'pagar-obrigacao', 'obrigacoes', null, null);
    formulario.controls['dataPagamento'].setValue('2026-10-08');
    expect(formulario.valid).toBe(true);
    expect(formulario.getRawValue()['valor']).toBeNull();
    formulario.controls['valor'].setValue(-1);
    expect(formulario.invalid).toBe(true);
  });
  it('trocar intenção remove entradas antigas e valida número inteiro de parcelas', () => {
    configurarFormularioCompromisso(formulario, 'pagar-fatura', 'cartoes', null, null);
    configurarFormularioCompromisso(formulario, 'criar', 'financiamentos', null, null);
    expect(formulario.controls['dataPagamento']).toBeUndefined();
    formulario.controls['numeroParcelas'].setValue(2.5);
    expect(formulario.controls['numeroParcelas'].hasError('integer')).toBe(true);
    formulario.controls['numeroParcelas'].setValue(2);
    expect(formulario.controls['numeroParcelas'].valid).toBe(true);
  });
});
