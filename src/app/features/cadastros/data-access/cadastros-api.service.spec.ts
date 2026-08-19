import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { environment } from '../../../environment/environment';
import { obterConfiguracaoCadastro } from '../cadastros.config';
import { RegistroCadastro } from '../cadastros.models';
import { CadastrosApiService } from './cadastros-api.service';

describe('CadastrosApiService', () => {
  let service: CadastrosApiService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(CadastrosApiService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTestingController.verify());

  it('lista bancos com a paginação do contrato', () => {
    service.listar(configuracao('bancos'), { pagina: 1, tamanho: 50 }).subscribe();

    const requisicao = httpTestingController.expectOne(
      (request) =>
        request.url === `${environment.apiUrl}/bancos` &&
        request.params.get('pagina') === '1' &&
        request.params.get('tamanho') === '50',
    );

    expect(requisicao.request.method).toBe('GET');
    requisicao.flush({ conteudo: [], pagina: 1, tamanho: 50, totalElementos: 0, totalPaginas: 0 });
  });

  it('cria uma conta com o request específico do recurso', () => {
    service
      .criar(configuracao('contas'), { nome: 'Conta principal', tipo: 'CORRENTE', bancoId: 9 })
      .subscribe();

    const requisicao = httpTestingController.expectOne(`${environment.apiUrl}/contas`);

    expect(requisicao.request.method).toBe('POST');
    expect(requisicao.request.body).toEqual({
      nome: 'Conta principal',
      tipo: 'CORRENTE',
      bancoId: 9,
    });
    requisicao.flush(registro());
  });

  it('inativa um meio de pagamento pelo identificador', () => {
    service.inativar(configuracao('meios-pagamento'), 42).subscribe();

    const requisicao = httpTestingController.expectOne(`${environment.apiUrl}/meios-pagamento/42`);

    expect(requisicao.request.method).toBe('DELETE');
    requisicao.flush(null);
  });
});

function configuracao(tipo: 'bancos' | 'contas' | 'meios-pagamento') {
  const configuracao = obterConfiguracaoCadastro(tipo);

  if (!configuracao) {
    throw new Error(`Configuração ${tipo} não encontrada.`);
  }

  return configuracao;
}

function registro(): RegistroCadastro {
  return { id: 1, nome: 'Conta principal', ativo: true };
}
