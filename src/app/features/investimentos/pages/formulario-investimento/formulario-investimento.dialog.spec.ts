import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { FocoAcessivelService } from '../../../../core/accessibility/foco-acessivel.service';
import { ReferenciasFinanceirasApiService } from '../../../../core/api/referencias-financeiras-api.service';
import { InvestimentosApiService } from '../../investimentos-api.service';
import { FormularioInvestimentoDialogComponent } from './formulario-investimento.dialog';

interface FormularioParaTeste {
  readonly formulario: {
    controls: {
      nome: { setValue(valor: string): void };
      contaOrigemId: { setValue(valor: number | null): void };
    };
  };
  salvar(): void;
}

describe('FormularioInvestimentoDialogComponent', () => {
  let component: FormularioInvestimentoDialogComponent;
  let api: { criar: ReturnType<typeof vi.fn> };
  let foco: { focarPorId: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    api = { criar: vi.fn(() => of({})) };
    foco = { focarPorId: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [FormularioInvestimentoDialogComponent],
      providers: [
        provideTranslateService(),
        { provide: MAT_DIALOG_DATA, useValue: {} },
        { provide: MatDialogRef, useValue: { close: vi.fn() } },
        { provide: MatDialog, useValue: { open: vi.fn() } },
        { provide: InvestimentosApiService, useValue: api },
        {
          provide: ReferenciasFinanceirasApiService,
          useValue: { listar: vi.fn(() => of([{ id: 1, nome: 'Conta' }])) },
        },
        { provide: FocoAcessivelService, useValue: foco },
      ],
    }).compileComponents();
    component = TestBed.createComponent(FormularioInvestimentoDialogComponent).componentInstance;
  });

  it('foca o primeiro campo e não envia enquanto inválido', () => {
    formulario().salvar();

    expect(api.criar).not.toHaveBeenCalled();
    expect(foco.focarPorId).toHaveBeenCalledWith('investimento-nome');
  });

  it('envia o identificador da conta como número', () => {
    formulario().formulario.controls.nome.setValue('CDB');
    formulario().formulario.controls.contaOrigemId.setValue(1);
    formulario().salvar();

    expect(api.criar).toHaveBeenCalledWith({ nome: 'CDB', tipo: 'RENDA_FIXA', contaOrigemId: 1 });
  });

  function formulario(): FormularioParaTeste {
    return component as unknown as FormularioParaTeste;
  }
});
