import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject, catchError, of, switchMap, tap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  DiaADiaApi,
  Historico,
  PaginaHttp,
  Transacao,
  TransacaoItemRequest,
  TransacaoRequest,
} from './dia-a-dia.api';
import { IMPORTS_DIA_A_DIA, EstadoDiaADia } from './dia-a-dia.ui';
import { SeletorReferenciaComponent } from '../../shared/seletor-referencia.component';
import { TransacaoSnapshotComponent } from './transacao-snapshot.component';

function formularioItem(valor?: TransacaoItemRequest) {
  return new FormGroup({
    itemId: new FormControl<number | null>(valor?.itemId ?? null, Validators.min(1)),
    descricao: new FormControl(valor?.descricao ?? '', {
      nonNullable: true,
      validators: Validators.maxLength(300),
    }),
    quantidade: new FormControl<number | null>(valor?.quantidade ?? null, Validators.min(0.000001)),
    valor: new FormControl<number | null>(valor?.valor ?? null, [
      Validators.required,
      Validators.min(0.01),
    ]),
    categoriaId: new FormControl<number | null>(valor?.categoriaId ?? null, Validators.min(1)),
  });
}
@Component({
  selector: 'fin-transacoes-page',
  standalone: true,
  imports: [...IMPORTS_DIA_A_DIA, SeletorReferenciaComponent, TransacaoSnapshotComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './transacoes.page.html',
  styleUrl: './dia-a-dia.scss',
})
export class TransacoesPage extends EstadoDiaADia {
  private readonly api = inject(DiaADiaApi);
  readonly pagina = signal<PaginaHttp<Transacao> | null>(null);
  readonly selecionado = signal<Transacao | null>(null);
  readonly historico = signal<PaginaHttp<Historico> | null>(null);
  readonly editando = signal<'nova' | 'correcao' | 'itens' | null>(null);
  readonly idEdicao = signal<number | null>(null);
  readonly filtros = new FormGroup({
    mes: new FormControl('', { nonNullable: true }),
    tipo: new FormControl('', { nonNullable: true }),
    categoriaId: new FormControl<number | null>(null, Validators.min(1)),
  });
  private readonly consulta = new BehaviorSubject({
    pagina: 0,
    filtros: this.filtros.getRawValue(),
  });
  readonly itens = new FormArray<ReturnType<typeof formularioItem>>([]);
  readonly formulario = new FormGroup({
    tipo: new FormControl<'ENTRADA' | 'SAIDA'>('SAIDA', {
      nonNullable: true,
      validators: Validators.required,
    }),
    valor: new FormControl<number | null>(null, [Validators.required, Validators.min(0.01)]),
    data: new FormControl('', { nonNullable: true, validators: Validators.required }),
    descricao: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(500)],
    }),
    contaId: new FormControl<number | null>(null, [Validators.required, Validators.min(1)]),
    categoriaId: new FormControl<number | null>(null, Validators.min(1)),
    meioPagamentoId: new FormControl<number | null>(null, Validators.min(1)),
    motivo: new FormControl('', { nonNullable: true }),
    itens: this.itens,
  });
  constructor() {
    super();
    this.consulta
      .pipe(
        tap(() => {
          this.ocupado.set(true);
          this.erro.set('');
        }),
        switchMap((consulta) =>
          this.api.transacoes(consulta.pagina, consulta.filtros).pipe(
            catchError(() => {
              this.erro.set('Não foi possível carregar as movimentações.');
              return of(null);
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((pagina) => {
        this.pagina.set(pagina);
        this.ocupado.set(false);
      });
  }
  carregar(pagina = 0): void {
    this.filtros.markAllAsTouched();
    if (this.filtros.valid) this.consulta.next({ pagina, filtros: this.filtros.getRawValue() });
  }
  limparFiltros(): void {
    this.filtros.reset();
    this.carregar();
  }
  temAlteracoes(): boolean {
    return this.editando() !== null && this.formulario.dirty;
  }
  dataCivil(valor: string): string {
    return `${valor.slice(8, 10)}/${valor.slice(5, 7)}/${valor.slice(0, 4)}`;
  }
  novaTransacao(): void {
    if (this.ocupado() || this.salvando()) return;
    const abrir = () => {
      this.idEdicao.set(null);
      this.editando.set('nova');
      this.itens.clear();
      this.formulario.reset({ tipo: 'SAIDA' });
      this.formulario.controls.motivo.clearValidators();
      this.formulario.controls.motivo.updateValueAndValidity();
    };
    if (this.temAlteracoes())
      this.confirmar('Descartar a movimentação em edição e criar outra?', abrir);
    else abrir();
  }
  detalhar(linha: Transacao): void {
    this.historico.set(null);
    this.executar(this.api.transacao(linha.id), (transacao) => this.selecionado.set(transacao));
  }
  editar(linha: Transacao, modo: 'correcao' | 'itens'): void {
    if (this.ocupado() || this.salvando()) return;
    const abrir = () =>
      this.executar(this.api.transacao(linha.id), (transacao) => {
        this.idEdicao.set(transacao.id);
        this.editando.set(modo);
        this.itens.clear();
        this.formulario.reset({
          tipo: transacao.tipo,
          valor: transacao.valor,
          data: transacao.data,
          descricao: transacao.descricao,
          contaId: transacao.contaId,
          categoriaId: transacao.categoriaId,
          meioPagamentoId: transacao.meioPagamentoId,
          motivo: '',
        });
        transacao.itens.forEach((item) => this.itens.push(formularioItem(item)));
        this.formulario.controls.motivo.setValidators([
          Validators.required,
          Validators.maxLength(500),
        ]);
        this.formulario.controls.motivo.updateValueAndValidity();
      });
    if (this.temAlteracoes())
      this.confirmar('Descartar as alterações e editar esta movimentação?', abrir);
    else abrir();
  }
  adicionarItem(): void {
    this.itens.push(formularioItem());
    this.formulario.markAsDirty();
  }
  removerItem(indice: number): void {
    this.itens.removeAt(indice);
    this.formulario.markAsDirty();
  }
  private payloadsItens(): TransacaoItemRequest[] {
    return this.itens.getRawValue().map((item) => ({
      itemId: item.itemId,
      descricao: item.descricao.trim() || null,
      quantidade: item.quantidade,
      valor: item.valor ?? 0,
      categoriaId: item.categoriaId,
    }));
  }
  salvar(): void {
    this.formulario.markAllAsTouched();
    const v = this.formulario.getRawValue();
    const id = this.idEdicao();
    if (
      this.formulario.invalid ||
      this.ocupado() ||
      this.salvando() ||
      v.contaId === null ||
      v.valor === null
    )
      return;
    const itens = this.payloadsItens();
    if (itens.some((item) => !item.itemId && !item.descricao)) {
      this.erro.set('Cada item precisa de uma descrição ou de um identificador do catálogo.');
      return;
    }
    const modo = this.editando();
    const aoConcluir = (transacao: Transacao) => {
      if (this.editando() === modo && this.idEdicao() === id) {
        this.idEdicao.set(transacao.id);
        if (JSON.stringify(this.formulario.getRawValue()) === JSON.stringify(v)) {
          this.formulario.markAsPristine();
          this.editando.set(null);
        } else if (modo === 'nova') {
          this.editando.set('correcao');
          this.formulario.controls.motivo.setValidators([
            Validators.required,
            Validators.maxLength(500),
          ]);
          this.formulario.controls.motivo.updateValueAndValidity();
        }
      }
      this.selecionado.set(transacao);
      this.historico.set(null);
      this.carregar(this.pagina()?.pagina ?? 0);
    };
    if (this.editando() === 'itens') {
      if (id === null || itens.length === 0) {
        this.erro.set('Adicione pelo menos um item para detalhar a movimentação.');
        return;
      }
      this.confirmar(
        'Substituir o detalhamento desta movimentação? A alteração ficará no histórico.',
        () => this.executar(this.api.detalhar(id, itens, v.motivo), aoConcluir, true),
      );
      return;
    }
    const corpo: TransacaoRequest = {
      tipo: v.tipo,
      valor: v.valor,
      data: v.data,
      descricao: v.descricao.trim(),
      contaId: v.contaId,
      categoriaId: v.categoriaId,
      meioPagamentoId: v.meioPagamentoId,
      itens: itens,
    };
    if (this.editando() === 'correcao' && id !== null)
      this.confirmar(
        'Confirmar a correção? O servidor atualizará os efeitos financeiros e registrará o motivo.',
        () =>
          this.executar(this.api.corrigir(id, { ...corpo, motivo: v.motivo }), aoConcluir, true),
      );
    else
      this.confirmar('Registrar esta movimentação na conta informada?', () =>
        this.executar(this.api.registrar(corpo), aoConcluir, true),
      );
  }
  cancelar(): void {
    if (this.ocupado() || this.salvando()) return;
    if (this.formulario.dirty)
      this.confirmar('Descartar as alterações da movimentação?', () => this.editando.set(null));
    else this.editando.set(null);
  }
  carregarHistorico(pagina = 0): void {
    const transacao = this.selecionado();
    if (transacao)
      this.executar(this.api.historico(transacao.id, pagina), (historico) =>
        this.historico.set(historico),
      );
  }
  estornar(linha: Transacao): void {
    this.confirmar(
      `Estornar a movimentação ${linha.descricao}? Comandos vinculados a faturas, transferências, obrigações e investimentos devem ser estornados na jornada de origem.`,
      () =>
        this.executar(
          this.api.estornar(linha.id),
          (transacao) => {
            this.selecionado.set(transacao);
            this.historico.set(null);
            this.carregar(this.pagina()?.pagina ?? 0);
          },
          true,
        ),
    );
  }
  rotuloCampo(campo: string): string {
    const rotulos: Record<string, string> = {
      ESTORNO: 'Estorno',
      tipo: 'Tipo',
      valor: 'Valor',
      data: 'Data',
      descricao: 'Descrição',
      contaId: 'Conta',
      categoriaId: 'Categoria',
      meioPagamentoId: 'Meio de pagamento',
      ITENS: 'Detalhamento de itens',
      DETALHAMENTO_ITENS: 'Detalhamento de itens',
      CORRECAO: 'Correção',
      itens: 'Itens',
    };
    return rotulos[campo] ?? 'Alteração registrada';
  }
}
