import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { vi } from 'vitest';

import { PaginaResponse } from '../../../../core/api/paginacao.model';
import { MensagemGlobalService } from '../../../../core/feedback/mensagem-global.service';
import { Banco } from '../../banco.model';
import { BancosApiService } from '../../bancos-api.service';
import { ListaBancosPage } from './lista-bancos.page';

interface ListaBancosParaTeste {
  readonly dados: () => PaginaResponse<Banco>;
  carregar(paginacao: { readonly pagina: number; readonly tamanho: number }): void;
}

describe('ListaBancosPage', () => {
  let component: ListaBancosPage;
  let api: { listar: ReturnType<typeof vi.fn> };
  let primeiraResposta: Subject<PaginaResponse<Banco>>;
  let segundaResposta: Subject<PaginaResponse<Banco>>;

  beforeEach(async () => {
    primeiraResposta = new Subject<PaginaResponse<Banco>>();
    segundaResposta = new Subject<PaginaResponse<Banco>>();
    api = {
      listar: vi.fn().mockReturnValueOnce(primeiraResposta).mockReturnValueOnce(segundaResposta),
    };

    await TestBed.configureTestingModule({
      imports: [ListaBancosPage],
      providers: [
        provideTranslateService(),
        { provide: BancosApiService, useValue: api },
        { provide: MatDialog, useValue: { open: vi.fn() } },
        { provide: MensagemGlobalService, useValue: { erro: vi.fn(), sucesso: vi.fn() } },
        {
          provide: ActivatedRoute,
          useValue: {
            queryParamMap: new Subject(),
            snapshot: { queryParamMap: convertToParamMap({}) },
          },
        },
        { provide: Router, useValue: { navigate: vi.fn() } },
      ],
    }).compileComponents();

    const fixture: ComponentFixture<ListaBancosPage> = TestBed.createComponent(ListaBancosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('cancela a listagem anterior para que uma resposta tardia não sobrescreva a página atual', () => {
    lista().carregar({ pagina: 1, tamanho: 20 });

    primeiraResposta.next(paginaCom('Banco antigo', 0));
    segundaResposta.next(paginaCom('Banco atual', 1));

    expect(lista().dados().conteudo).toEqual([
      expect.objectContaining({ id: 2, nome: 'Banco atual' }),
    ]);
  });

  function lista(): ListaBancosParaTeste {
    return component as unknown as ListaBancosParaTeste;
  }

  function paginaCom(nome: string, pagina: number): PaginaResponse<Banco> {
    return {
      conteudo: [{ id: pagina + 1, nome, codigo: '001', sistema: false }],
      pagina,
      tamanho: 20,
      totalElementos: 1,
      totalPaginas: 1,
    };
  }
});
