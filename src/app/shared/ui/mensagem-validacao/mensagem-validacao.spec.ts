import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, Validators } from '@angular/forms';
import { provideTranslateService } from '@ngx-translate/core';

import { MensagemValidacaoComponent } from './mensagem-validacao';

describe('MensagemValidacaoComponent', () => {
  let fixture: ComponentFixture<MensagemValidacaoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MensagemValidacaoComponent],
      providers: [provideTranslateService()],
    }).compileComponents();

    fixture = TestBed.createComponent(MensagemValidacaoComponent);
  });

  it('prioriza a mensagem de obrigatoriedade', () => {
    fixture.componentRef.setInput(
      'controle',
      new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    );
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('CADASTROS.VALIDACOES.OBRIGATORIO');
  });

  it('informa o limite configurado quando o tamanho máximo é excedido', () => {
    fixture.componentRef.setInput(
      'controle',
      new FormControl('abc', { nonNullable: true, validators: [Validators.maxLength(2)] }),
    );
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('CADASTROS.VALIDACOES.TAMANHO_MAXIMO');
  });
});
