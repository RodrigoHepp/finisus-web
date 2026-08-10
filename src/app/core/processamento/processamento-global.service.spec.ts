import { TestBed } from '@angular/core/testing';

import { ProcessamentoGlobalService } from './processamento-global.service';

describe('ProcessamentoGlobalService', () => {
  it('mantém o indicador visível até que todos os processamentos terminem', () => {
    const service = TestBed.inject(ProcessamentoGlobalService);
    const encerrarPrimeiro = service.iniciar('AUTENTICACAO.SESSAO.RESTAURANDO');
    const encerrarSegundo = service.iniciar('Salvando alterações...');

    expect(service.estaProcessando()).toBe(true);
    expect(service.mensagem()).toBe('Salvando alterações...');

    encerrarPrimeiro();
    expect(service.estaProcessando()).toBe(true);

    encerrarSegundo();
    expect(service.estaProcessando()).toBe(false);
    expect(service.mensagem()).toBe('COMPARTILHADO.PROCESSAMENTO.PADRAO');
  });
});
