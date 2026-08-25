import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { of, Subject } from 'rxjs';
import { vi } from 'vitest';

import { MensagemGlobalService } from '../../../../core/feedback/mensagem-global.service';
import { RecorrenciasApiService } from '../../recorrencias-api.service';
import { ListaRecorrenciasPage } from './lista-recorrencias.page';

interface ListaRecorrenciasParaTeste {
  readonly gerandoMes: () => boolean;
  gerarMesAtual(): void;
  navegarParaPagina(pagina: number): void;
}

describe('ListaRecorrenciasPage', () => {
  let component: ListaRecorrenciasPage;
  let api: { listar: ReturnType<typeof vi.fn>; gerarMes: ReturnType<typeof vi.fn> };
  let router: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    api = {
      listar: vi.fn(() =>
        of({ conteudo: [], pagina: 0, tamanho: 20, totalElementos: 0, totalPaginas: 0 }),
      ),
      gerarMes: vi.fn(() => new Subject()),
    };
    router = { navigate: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [ListaRecorrenciasPage],
      providers: [
        provideTranslateService(),
        { provide: RecorrenciasApiService, useValue: api },
        { provide: MatDialog, useValue: { open: vi.fn() } },
        { provide: MensagemGlobalService, useValue: { sucesso: vi.fn(), erro: vi.fn() } },
        {
          provide: ActivatedRoute,
          useValue: {
            queryParamMap: of(convertToParamMap({})),
            snapshot: { queryParamMap: convertToParamMap({}) },
          },
        },
        { provide: Router, useValue: router },
      ],
    }).compileComponents();
    const fixture: ComponentFixture<ListaRecorrenciasPage> =
      TestBed.createComponent(ListaRecorrenciasPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('não gera o mês duas vezes enquanto a primeira solicitação está pendente', () => {
    lista().gerarMesAtual();
    lista().gerarMesAtual();

    expect(api.gerarMes).toHaveBeenCalledTimes(1);
    expect(lista().gerandoMes()).toBe(true);
  });

  it('sincroniza a paginação com a URL', () => {
    lista().navegarParaPagina(2);

    expect(router.navigate).toHaveBeenCalledWith(
      [],
      expect.objectContaining({ queryParams: { pagina: 3 } }),
    );
  });

  function lista(): ListaRecorrenciasParaTeste {
    return component as unknown as ListaRecorrenciasParaTeste;
  }
});
