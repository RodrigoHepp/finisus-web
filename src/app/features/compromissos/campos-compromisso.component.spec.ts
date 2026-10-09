import { TestBed } from '@angular/core/testing';
import { FormControl, FormRecord } from '@angular/forms';
import { CamposCompromissoComponent } from './campos-compromisso.component';
import { configurarFormularioCompromisso, ValorCampo } from './formulario-compromisso';

describe('Apresentação independente dos campos de compromissos', () => {
  it('conecta entradas ao formulário da jornada e preserva bloqueio durante envio', async () => {
    await TestBed.configureTestingModule({
      imports: [CamposCompromissoComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(CamposCompromissoComponent);
    const formulario = new FormRecord<FormControl<ValorCampo>>({});
    const campos = configurarFormularioCompromisso(
      formulario,
      'pagar-parcela',
      'financiamentos',
      null,
      null,
    );
    fixture.componentRef.setInput('formulario', formulario);
    fixture.componentRef.setInput('campos', campos);
    fixture.componentRef.setInput('opcoes', () => []);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.value = '2026-10-08';
    input.dispatchEvent(new Event('input'));
    expect(formulario.controls['dataPagamento'].value).toBe('2026-10-08');
    expect(formulario.dirty).toBe(true);
    formulario.disable();
    fixture.detectChanges();
    expect(input.disabled).toBe(true);
  });
});
