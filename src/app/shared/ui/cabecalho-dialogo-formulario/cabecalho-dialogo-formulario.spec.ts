import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';

import { CabecalhoDialogoFormularioComponent } from './cabecalho-dialogo-formulario';

describe('CabecalhoDialogoFormularioComponent', () => {
  let fixture: ComponentFixture<CabecalhoDialogoFormularioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CabecalhoDialogoFormularioComponent],
      providers: [provideTranslateService()],
    }).compileComponents();

    fixture = TestBed.createComponent(CabecalhoDialogoFormularioComponent);
    fixture.componentRef.setInput('titulo', 'Novo banco');
    fixture.componentRef.setInput('descricao', 'Dados do banco.');
  });

  it('emite o fechamento e desabilita o botão durante o envio', () => {
    let fechado = false;
    fixture.componentInstance.fechar.subscribe(() => (fechado = true));
    fixture.componentRef.setInput('enviando', true);
    fixture.detectChanges();

    const botao = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(botao.disabled).toBe(true);

    fixture.componentRef.setInput('enviando', false);
    fixture.detectChanges();
    botao.click();

    expect(fechado).toBe(true);
  });
});
