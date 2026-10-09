import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject, catchError, of, switchMap, tap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  Ajuste,
  Conta,
  DiaADiaApi,
  ChaveIntencao,
  PaginaHttp,
  Reconciliacao,
  TipoConta,
  Transferencia,
} from './dia-a-dia.api';
import { IMPORTS_DIA_A_DIA, EstadoDiaADia } from './dia-a-dia.ui';
import { SeletorReferenciaComponent } from '../../shared/seletor-referencia.component';

@Component({
  selector: 'fin-contas-page',
  standalone: true,
  imports: [...IMPORTS_DIA_A_DIA, SeletorReferenciaComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './contas.page.html',
  styleUrl: './dia-a-dia.scss',
})
export class ContasPage extends EstadoDiaADia {
  private readonly api = inject(DiaADiaApi);
  private readonly consulta = new BehaviorSubject(0);
  private readonly intencaoAjuste = new ChaveIntencao();
  private readonly intencaoTransferencia = new ChaveIntencao();
  readonly pagina = signal<PaginaHttp<Conta> | null>(null);
  readonly selecionado = signal<Conta | null>(null);
  readonly reconciliacao = signal<Reconciliacao | null>(null);
  readonly ajustes = signal<PaginaHttp<Ajuste> | null>(null);
  readonly transferencia = signal<Transferencia | null>(null);
  readonly editando = signal(false);
  readonly idEdicao = signal<number | null>(null);
  readonly tipos: { valor: TipoConta; rotulo: string }[] = [
    { valor: 'FISICO', rotulo: 'Dinheiro em espécie' },
    { valor: 'CORRENTE', rotulo: 'Conta corrente' },
    { valor: 'POUPANCA', rotulo: 'Poupança' },
    { valor: 'APLICACAO', rotulo: 'Aplicação' },
  ];
  readonly formulario = new FormGroup({
    nome: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(150)],
    }),
    tipo: new FormControl<TipoConta>('CORRENTE', { nonNullable: true }),
    bancoId: new FormControl<number | null>(null, Validators.min(1)),
  });
  readonly formularioAjuste = new FormGroup({
    saldoInformado: new FormControl<number | null>(null, [Validators.required, Validators.min(0)]),
    motivo: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(500)],
    }),
  });
  readonly formularioTransferencia = new FormGroup({
    contaOrigemId: new FormControl<number | null>(null, [Validators.required, Validators.min(1)]),
    contaDestinoId: new FormControl<number | null>(null, [Validators.required, Validators.min(1)]),
    valor: new FormControl<number | null>(null, [Validators.required, Validators.min(0.01)]),
    data: new FormControl('', { nonNullable: true, validators: Validators.required }),
    descricao: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(300)],
    }),
  });
  readonly consultaTransferencia = new FormControl<number | null>(null, [
    Validators.required,
    Validators.min(1),
  ]);
  constructor() {
    super();
    const configurarBanco = (tipo: TipoConta) => {
      if (tipo === 'FISICO') this.formulario.controls.bancoId.setValue(null);
      this.formulario.controls.bancoId.setValidators(
        tipo === 'FISICO' ? [] : [Validators.required, Validators.min(1)],
      );
      this.formulario.controls.bancoId.updateValueAndValidity();
    };
    configurarBanco(this.formulario.controls.tipo.value);
    this.formulario.controls.tipo.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(configurarBanco);
    this.consulta
      .pipe(
        tap(() => {
          this.ocupado.set(true);
          this.erro.set('');
        }),
        switchMap((pagina) =>
          this.api.contas(pagina).pipe(
            catchError(() => {
              this.erro.set('Não foi possível carregar as contas.');
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
  carregar(pagina = this.pagina()?.pagina ?? 0): void {
    this.consulta.next(pagina);
  }
  temAlteracoes(): boolean {
    return (
      (this.editando() && this.formulario.dirty) ||
      this.formularioTransferencia.dirty ||
      (this.selecionado() !== null && this.formularioAjuste.dirty)
    );
  }
  rotuloTipo(tipo: TipoConta): string {
    return this.tipos.find((valor) => valor.valor === tipo)?.rotulo ?? 'Tipo não reconhecido';
  }
  novaConta(): void {
    if (this.ocupado() || this.salvando()) return;
    const abrir = () => {
      this.idEdicao.set(null);
      this.formulario.reset({ tipo: 'CORRENTE' });
      this.editando.set(true);
    };
    if (this.editando() && this.formulario.dirty)
      this.confirmar('Descartar a conta em edição e criar outra?', abrir);
    else abrir();
  }
  detalhar(linha: Conta): void {
    if (this.ocupado() || this.salvando()) return;
    const abrir = () => {
      this.reconciliacao.set(null);
      this.ajustes.set(null);
      this.formularioAjuste.reset();
      this.executar(this.api.conta(linha.id), (conta) => this.selecionado.set(conta));
    };
    if (this.selecionado() && this.formularioAjuste.dirty)
      this.confirmar('Descartar o ajuste em edição e conferir outra conta?', abrir);
    else abrir();
  }
  fecharDetalhes(): void {
    if (this.ocupado() || this.salvando()) return;
    const fechar = () => {
      this.selecionado.set(null);
      this.reconciliacao.set(null);
      this.ajustes.set(null);
      this.formularioAjuste.reset();
    };
    if (this.formularioAjuste.dirty) this.confirmar('Descartar o ajuste em edição?', fechar);
    else fechar();
  }
  editar(linha: Conta): void {
    if (this.ocupado() || this.salvando()) return;
    const abrir = () =>
      this.executar(this.api.conta(linha.id), (conta) => {
        this.idEdicao.set(conta.id);
        this.formulario.reset({ nome: conta.nome, tipo: conta.tipo, bancoId: conta.bancoId });
        this.editando.set(true);
      });
    if (this.editando() && this.formulario.dirty)
      this.confirmar('Descartar as alterações e editar esta conta?', abrir);
    else abrir();
  }
  salvar(): void {
    this.formulario.markAllAsTouched();
    if (this.formulario.invalid || this.ocupado() || this.salvando()) return;
    const enviado = this.formulario.getRawValue();
    const id = this.idEdicao();
    this.executar(
      this.api.salvarConta(enviado, id),
      (salvo) => {
        if (this.editando() && this.idEdicao() === id) {
          this.idEdicao.set(salvo.id);
          if (JSON.stringify(this.formulario.getRawValue()) === JSON.stringify(enviado)) {
            this.formulario.markAsPristine();
            this.editando.set(false);
          }
        }
        this.selecionado.set(null);
        this.carregar();
      },
      true,
    );
  }
  cancelar(): void {
    if (this.ocupado() || this.salvando()) return;
    if (this.formulario.dirty)
      this.confirmar('Descartar as alterações da conta?', () => this.editando.set(false));
    else this.editando.set(false);
  }
  inativar(linha: Conta): void {
    this.confirmar(`Inativar a conta ${linha.nome}?`, () =>
      this.executar(
        this.api.inativarConta(linha.id),
        () => {
          this.selecionado.set(null);
          this.carregar();
        },
        true,
      ),
    );
  }
  reconciliar(): void {
    const conta = this.selecionado();
    if (conta)
      this.executar(this.api.reconciliar(conta.id), (resultado) =>
        this.reconciliacao.set(resultado),
      );
  }
  carregarAjustes(pagina = 0): void {
    const conta = this.selecionado();
    if (conta)
      this.executar(this.api.ajustes(conta.id, pagina), (resultado) => this.ajustes.set(resultado));
  }
  ajustar(): void {
    this.formularioAjuste.markAllAsTouched();
    const conta = this.selecionado(),
      v = this.formularioAjuste.getRawValue();
    if (
      !conta ||
      this.formularioAjuste.invalid ||
      v.saldoInformado === null ||
      this.ocupado() ||
      this.salvando()
    )
      return;
    const corpo = { saldoInformado: v.saldoInformado, motivo: v.motivo };
    const chave = this.intencaoAjuste.obterChave({ contaId: conta.id, ...corpo });
    this.confirmar(
      `Registrar saldo informado de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(corpo.saldoInformado)} na conta ${conta.nome}? O servidor calculará o ajuste.`,
      () =>
        this.executar(
          this.api.ajustar(conta.id, corpo, chave),
          () => {
            this.intencaoAjuste.concluir();
            if (JSON.stringify(this.formularioAjuste.getRawValue()) === JSON.stringify(v)) {
              this.formularioAjuste.reset();
              this.selecionado.set(null);
            }
            this.reconciliacao.set(null);
            this.ajustes.set(null);
            this.carregar();
          },
          true,
        ),
    );
  }
  transferir(): void {
    this.formularioTransferencia.markAllAsTouched();
    const v = this.formularioTransferencia.getRawValue();
    if (
      this.formularioTransferencia.invalid ||
      this.ocupado() ||
      this.salvando() ||
      v.contaOrigemId === null ||
      v.contaDestinoId === null ||
      v.valor === null
    )
      return;
    if (v.contaOrigemId === v.contaDestinoId) {
      this.erro.set('Escolha contas de origem e destino diferentes.');
      return;
    }
    const corpo = {
      contaOrigemId: v.contaOrigemId,
      contaDestinoId: v.contaDestinoId,
      valor: v.valor,
      data: v.data,
      descricao: v.descricao,
    };
    const chave = this.intencaoTransferencia.obterChave(corpo);
    this.confirmar('Confirmar a transferência entre as contas informadas?', () =>
      this.executar(
        this.api.transferir(corpo, chave),
        (resultado) => {
          this.intencaoTransferencia.concluir();
          this.transferencia.set(resultado);
          if (JSON.stringify(this.formularioTransferencia.getRawValue()) === JSON.stringify(v))
            this.formularioTransferencia.reset();
          this.carregar();
        },
        true,
      ),
    );
  }
  buscarTransferencia(): void {
    this.consultaTransferencia.markAsTouched();
    const id = this.consultaTransferencia.value;
    if (id !== null && this.consultaTransferencia.valid)
      this.executar(this.api.transferencia(id), (resultado) => this.transferencia.set(resultado));
  }
  estornarTransferencia(): void {
    const transferencia = this.transferencia();
    if (transferencia)
      this.confirmar(
        'Estornar esta transferência? O servidor reverterá os dois movimentos vinculados.',
        () =>
          this.executar(
            this.api.estornarTransferencia(transferencia.id),
            (resultado) => {
              this.transferencia.set(resultado);
              this.carregar();
            },
            true,
          ),
      );
  }
}
