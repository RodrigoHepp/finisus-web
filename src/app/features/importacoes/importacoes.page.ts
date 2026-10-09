import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  TipoDocumentoFinanceiro,
  TipoTransacao,
  DecisaoRevisaoImportacao,
} from '../../infraestrutura/api/backend.dtos';
import { formatarDataCivil, formatarMoeda } from '../../shared/apresentacao';
import { SeletorReferenciaComponent } from '../../shared/seletor-referencia.component';
import { IMPORTS_JORNADA, EstadoJornada } from '../../shared/jornada.ui';
import {
  ImportacoesApi,
  DocumentoImportacao,
  LancamentoImportado,
  RevisaoImportacao,
  RevisaoImportacaoInput,
} from './importacoes.api';
@Component({
  selector: 'fin-importacoes',
  standalone: true,
  imports: [...IMPORTS_JORNADA, SeletorReferenciaComponent],
  templateUrl: './importacoes.page.html',
  styleUrl: '../../shared/jornada.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportacoesPage extends EstadoJornada {
  private revisaoFormulario = 0;
  private geracaoDocumento = 0;
  private readonly api = inject(ImportacoesApi);
  private readonly fb = inject(FormBuilder);
  readonly formatarMoeda = formatarMoeda;
  readonly dataCivil = formatarDataCivil;
  readonly documento = signal<DocumentoImportacao | null>(null);
  readonly revisao = signal<RevisaoImportacao | null>(null);
  readonly revisado = signal(false);
  readonly arquivo = signal<File | null>(null);
  readonly formularioEnvio = this.fb.group({
    bancoId: this.fb.control<number | null>(null, [Validators.required, Validators.min(1)]),
    tipoDocumento: this.fb.nonNullable.control<TipoDocumentoFinanceiro>(
      'EXTRATO_CONTA',
      Validators.required,
    ),
    destinoId: this.fb.control<number | null>(null, [Validators.required, Validators.min(1)]),
  });
  readonly formularioRetomada = this.fb.group({
    id: this.fb.control<number | null>(null, [Validators.required, Validators.min(1)]),
  });
  readonly formularioDestino = this.fb.group({
    destinoId: this.fb.control<number | null>(null, [Validators.required, Validators.min(1)]),
  });
  readonly linhas = this.fb.array<ReturnType<ImportacoesPage['formularioLancamento']>>([]);
  constructor() {
    super();
    this.linhas.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.revisaoFormulario++;
      this.revisado.set(false);
    });
    this.formularioDestino.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.revisaoFormulario++;
      this.revisado.set(false);
    });
  }
  temAlteracoes(): boolean {
    return this.formularioEnvio.dirty || this.linhas.dirty || this.formularioDestino.dirty;
  }
  tipo(valor: string | null): string {
    if (valor === 'EXTRATO_CONTA') return 'Extrato de conta';
    if (valor === 'FATURA_CARTAO') return 'Fatura de cartão';
    if (valor === 'COBRANCA') return 'Cobrança';
    return 'Não informado';
  }
  tipoTransacao(valor: string | null): string {
    if (valor === 'ENTRADA') return 'Entrada';
    if (valor === 'SAIDA') return 'Saída';
    return 'Não identificado';
  }
  decisao(valor: string): string {
    return (
      (
        {
          CRIAR: 'Criar lançamento',
          IGNORAR: 'Descartar',
          ASSOCIAR_TRANSACAO: 'Associar transação existente',
          ASSOCIAR_OBRIGACAO: 'Associar obrigação existente',
        } as Record<string, string>
      )[valor] ?? 'Decisão pendente'
    );
  }
  estado(valor: string): string {
    return (
      (
        {
          PENDENTE: 'Pendente',
          IGNORADA: 'Descartado',
          ASSOCIADA: 'Associado',
          CRIADA: 'Criado',
        } as Record<string, string>
      )[valor] ?? 'Situação não reconhecida'
    );
  }
  selecionarArquivo(event: Event): void {
    const arquivo = (event.target as HTMLInputElement).files?.item(0) ?? null;
    this.arquivo.set(null);
    this.erro.set('');
    if (!arquivo) return;
    if (
      arquivo.size === 0 ||
      arquivo.size > 10 * 1024 * 1024 ||
      !arquivo.name.toLowerCase().endsWith('.pdf') ||
      (arquivo.type && arquivo.type !== 'application/pdf')
    ) {
      this.erro.set('Selecione um PDF de até 10 MB. O arquivo precisa conter texto legível.');
      return;
    }
    this.arquivo.set(arquivo);
  }
  enviarArquivo(): void {
    if (this.salvando()) return;
    this.formularioEnvio.markAllAsTouched();
    const valor = this.formularioEnvio.getRawValue();
    const arquivo = this.arquivo();
    if (
      this.formularioEnvio.invalid ||
      valor.bancoId === null ||
      valor.destinoId === null ||
      !arquivo
    ) {
      if (!arquivo) this.erro.set('Selecione o arquivo PDF.');
      return;
    }
    const geracao = ++this.geracaoDocumento;
    this.executar(
      this.api.enviarArquivo(arquivo, {
        bancoId: valor.bancoId,
        tipoDocumento: valor.tipoDocumento,
        contaId: valor.tipoDocumento === 'FATURA_CARTAO' ? null : valor.destinoId,
        faturaId: valor.tipoDocumento === 'FATURA_CARTAO' ? valor.destinoId : null,
      }),
      (revisao) => {
        if (geracao === this.geracaoDocumento) this.aplicarRevisao(revisao);
      },
      true,
    );
  }
  retomar(): void {
    if (this.salvando()) return;
    this.formularioRetomada.markAllAsTouched();
    const id = this.formularioRetomada.controls.id.value;
    if (this.formularioRetomada.invalid || id === null) return;
    const abrir = () => {
      const geracao = ++this.geracaoDocumento;
      this.executar(this.api.consultar(id), (revisao) => {
        if (geracao === this.geracaoDocumento) this.aplicarRevisao(revisao);
      });
    };
    if (this.linhas.dirty || this.formularioDestino.dirty)
      this.confirmar('Descartar a revisão em edição e consultar outra importação?', abrir);
    else abrir();
  }
  reiniciar(): void {
    if (this.salvando()) return;
    if (this.linhas.dirty && !this.revisado())
      this.confirmar(
        'Deixar esta revisão? Alterações não salvas serão perdidas. A importação poderá ser retomada pelo identificador.',
        () => this.limpar(),
      );
    else this.limpar();
  }
  private limpar(): void {
    this.geracaoDocumento++;
    this.documento.set(null);
    this.revisao.set(null);
    this.linhas.clear();
    this.revisado.set(false);
    this.arquivo.set(null);
  }
  private formularioLancamento(linha: LancamentoImportado) {
    return this.fb.group({
      id: this.fb.nonNullable.control(linha.id),
      decisao: this.fb.nonNullable.control<DecisaoRevisaoImportacao | ''>('', Validators.required),
      data: this.fb.nonNullable.control(linha.data ?? ''),
      descricao: this.fb.nonNullable.control(linha.descricao ?? ''),
      valor: this.fb.control<number | null>(linha.valor),
      tipo: this.fb.control<TipoTransacao | null>(linha.tipo),
      categoriaId: this.fb.control<number | null>(linha.categoriaId, Validators.min(1)),
      itemId: this.fb.control<number | null>(linha.itemId, Validators.min(1)),
      existenteId: this.fb.control<number | null>(
        linha.transacaoId ?? linha.obrigacaoFinanceiraId,
        Validators.min(1),
      ),
      justificativa: this.fb.nonNullable.control('', [
        Validators.required,
        Validators.maxLength(500),
        Validators.pattern(/\S/),
      ]),
    });
  }
  private aplicarRevisao(revisao: RevisaoImportacao): void {
    this.documento.set(revisao.importacao);
    this.revisao.set(revisao);
    this.linhas.clear();
    revisao.importacao.lancamentos.forEach((linha) =>
      this.linhas.push(this.formularioLancamento(linha)),
    );
    this.formularioDestino.controls.destinoId.setValue(
      revisao.importacao.tipoDocumento === 'FATURA_CARTAO'
        ? revisao.importacao.faturaId
        : revisao.importacao.contaId,
    );
    this.linhas.markAsPristine();
    this.formularioEnvio.markAsPristine();
    this.formularioDestino.markAsPristine();
    this.arquivo.set(null);
    this.revisado.set(false);
  }
  salvarRevisao(): void {
    if (this.salvando()) return;
    const documento = this.documento();
    if (!documento || documento.status === 'CONFIRMADA') return;
    this.linhas.markAllAsTouched();
    this.formularioDestino.markAllAsTouched();
    if (this.linhas.invalid || this.formularioDestino.invalid || this.linhas.length === 0) {
      this.erro.set('Revise cada lançamento, escolha uma decisão e informe sua justificativa.');
      return;
    }
    const valores = this.linhas.getRawValue();
    for (const linha of valores) {
      const erro = this.erroLancamento(linha, documento.tipoDocumento);
      if (erro) {
        this.erro.set(erro);
        return;
      }
    }
    const destino = this.formularioDestino.controls.destinoId.value;
    const input: RevisaoImportacaoInput = {
      contaId: documento.tipoDocumento === 'FATURA_CARTAO' ? null : destino,
      faturaId: documento.tipoDocumento === 'FATURA_CARTAO' ? destino : null,
      lancamentos: valores.map((linha) => ({
        id: linha.id,
        data: linha.data || null,
        descricao: linha.descricao || null,
        valor: linha.valor,
        tipo: linha.tipo,
        importar: linha.decisao !== 'IGNORAR',
        categoriaId: linha.categoriaId,
        itemId: linha.itemId,
        transacaoId: linha.decisao === 'ASSOCIAR_TRANSACAO' ? linha.existenteId : null,
        obrigacaoFinanceiraId: linha.decisao === 'ASSOCIAR_OBRIGACAO' ? linha.existenteId : null,
        justificativa: linha.justificativa,
      })),
    };
    const revisaoEnviada = this.revisaoFormulario;
    const geracao = this.geracaoDocumento;
    this.revisado.set(false);
    this.executar(
      this.api.revisao(documento.id, input),
      (revisao) => {
        if (geracao !== this.geracaoDocumento || this.documento()?.id !== documento.id) return;
        this.revisao.set(revisao);
        this.documento.set(revisao.importacao);
        if (this.revisaoFormulario !== revisaoEnviada) {
          this.erro.set(
            'Os campos mudaram enquanto a revisão era salva. Confira e salve novamente antes de confirmar.',
          );
          return;
        }
        // Apresenta o snapshot exato aceito pelo servidor, preservando a decisão humana.
        this.aplicarLancamentosAceitos(revisao);
        this.linhas.markAsPristine();
        this.formularioDestino.markAsPristine();
        this.revisado.set(true);
      },
      true,
    );
  }
  private erroLancamento(
    linha: ReturnType<ImportacoesPage['linhas']['getRawValue']>[number],
    tipoDocumento: TipoDocumentoFinanceiro,
  ): string {
    const ignorado = linha.decisao === 'IGNORAR';
    if (
      !ignorado &&
      (!linha.data ||
        !linha.descricao.trim() ||
        linha.valor === null ||
        linha.valor < 0.01 ||
        linha.tipo === null)
    ) {
      return `Complete data, descrição, valor e tipo do lançamento #${linha.id}.`;
    }
    if (linha.decisao.startsWith('ASSOCIAR') && linha.existenteId === null) {
      return `Informe o identificador existente para o lançamento #${linha.id}.`;
    }
    const cobranca = tipoDocumento === 'COBRANCA';
    const associacaoIncompativel = cobranca
      ? linha.decisao === 'ASSOCIAR_TRANSACAO'
      : linha.decisao === 'ASSOCIAR_OBRIGACAO';
    if (associacaoIncompativel) return 'A associação deve corresponder ao tipo de documento.';
    if (cobranca && !ignorado && linha.tipo !== 'SAIDA') {
      return 'Cobranças devem ser revisadas como saídas. Criar uma obrigação não registra pagamento.';
    }
    return '';
  }
  private aplicarLancamentosAceitos(revisao: RevisaoImportacao): void {
    revisao.importacao.lancamentos.forEach((linha, indice) => {
      const controle = this.linhas.at(indice);
      if (controle?.controls.id.value !== linha.id) return;
      controle.patchValue(
        {
          data: linha.data ?? '',
          descricao: linha.descricao ?? '',
          valor: linha.valor,
          tipo: linha.tipo,
          categoriaId: linha.categoriaId,
          itemId: linha.itemId,
          existenteId: linha.transacaoId ?? linha.obrigacaoFinanceiraId,
        },
        { emitEvent: false },
      );
    });
    this.formularioDestino.controls.destinoId.setValue(
      revisao.importacao.tipoDocumento === 'FATURA_CARTAO'
        ? revisao.importacao.faturaId
        : revisao.importacao.contaId,
      { emitEvent: false },
    );
  }
  confirmarImportacao(): void {
    const documento = this.documento();
    if (!documento || !this.revisado() || documento.status === 'CONFIRMADA') return;
    this.confirmar(
      'Confirmar a revisão e efetivar os lançamentos escolhidos? Duplicidades não são descartadas automaticamente. Cobranças criam obrigações, sem pagamento.',
      () => {
        if (!this.revisado() || this.documento()?.id !== documento.id) return;
        this.executar(
          this.api.confirmar(documento.id),
          (resultado) => {
            this.documento.set(resultado);
            this.revisado.set(false);
          },
          true,
        );
      },
    );
  }
}
