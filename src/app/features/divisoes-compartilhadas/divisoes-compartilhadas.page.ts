import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { Pagina } from '../../infraestrutura/api/backend.dtos';
import { formatarDataCivil, formatarMoeda } from '../../shared/apresentacao';
import { FormulariosDivisoesCompartilhadas } from './divisoes-compartilhadas.forms';
import { IMPORTS_JORNADA, EstadoJornada } from '../../shared/jornada.ui';
import {
  DivisoesCompartilhadasApi,
  Alocacao,
  DivisaoCompartilhada,
  ResumoDivisao,
  HistoricoParticipante,
  PagamentoDivisao,
  AssociacaoPendente,
  Reembolso,
} from './divisoes-compartilhadas.api';
@Component({
  selector: 'fin-divisoes-compartilhadas',
  standalone: true,
  imports: IMPORTS_JORNADA,
  templateUrl: './divisoes-compartilhadas.page.html',
  styleUrl: '../../shared/jornada.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DivisoesCompartilhadasPage extends EstadoJornada {
  private selecaoDivisao = 0;
  private selecaoLista = 0;
  private selecaoResumo = 0;
  private selecaoDetalhe = 0;
  private readonly api = inject(DivisoesCompartilhadasApi);
  readonly formatarMoeda = formatarMoeda;
  readonly dataCivil = formatarDataCivil;
  readonly divisoes = signal<Pagina<DivisaoCompartilhada> | null>(null);
  readonly selecionado = signal<DivisaoCompartilhada | null>(null);
  readonly resumo = signal<ResumoDivisao | null>(null);
  readonly historico = signal<HistoricoParticipante[]>([]);
  readonly pendencias = signal<AssociacaoPendente[]>([]);
  readonly reembolsos = signal<Reembolso[]>([]);
  readonly pagamento = signal<PagamentoDivisao | null>(null);
  readonly alocacoes = signal<Alocacao[]>([]);
  readonly transacao = signal<number | null>(null);
  readonly aceitouParticipacao = signal<boolean | null>(null);
  readonly mostrarCriacao = signal(false);
  readonly usuarioAtualId = signal<number | null>(null);
  ehCriador(): boolean {
    return this.selecionado()?.criadorId === this.usuarioAtualId();
  }
  private readonly formularios = new FormulariosDivisoesCompartilhadas();
  readonly participantes = this.formularios.participantes;
  readonly formularioDivisao = this.formularios.formularioDivisao;
  readonly formularioPeriodo = this.formularios.formularioPeriodo;
  readonly formularioAssociacao = this.formularios.formularioAssociacao;
  readonly formularioConsulta = this.formularios.formularioConsulta;
  readonly responsabilidades = this.formularios.responsabilidades;
  readonly formulariosAlocacao = this.formularios.formulariosAlocacao;
  readonly formularioReembolso = this.formularios.formularioReembolso;
  constructor() {
    super();
    this.executar(this.api.usuarioAtual(), (usuario) => {
      this.usuarioAtualId.set(usuario.id);
      this.carregar();
      this.executar(this.api.consultarAceite(), (valor) =>
        this.aceitouParticipacao.set(valor.aceita),
      );
    });
  }
  temAlteracoes(): boolean {
    return this.formularios.temAlteracoes();
  }
  adicionarParticipante(): void {
    this.formularios.adicionarParticipante();
  }
  adicionarResponsabilidade(): void {
    this.formularios.adicionarResponsabilidade();
  }
  adicionarAlocacao(): void {
    this.formularios.adicionarAlocacao();
  }
  carregar(event?: PageEvent): void {
    const selecao = ++this.selecaoLista;
    this.divisoes.set(null);
    this.executar(this.api.listar(event?.pageIndex ?? 0, event?.pageSize ?? 20), (pagina) => {
      if (selecao === this.selecaoLista) this.divisoes.set(pagina);
    });
  }
  criarDivisao(): void {
    this.formularioDivisao.markAllAsTouched();
    if (this.formularioDivisao.invalid || !this.participantes.length) return;
    const valores = this.participantes.getRawValue();
    const participantes = valores.flatMap((valor) =>
      valor.usuarioId !== null
        ? [{ usuarioId: valor.usuarioId, percentual: valor.percentual }]
        : [],
    );
    this.executar(
      this.api.criar(this.formularioDivisao.controls.nome.value, participantes),
      (divisao) => {
        this.formularioDivisao.markAsPristine();
        this.mostrarCriacao.set(false);
        this.carregar();
        this.abrirDivisao(divisao.id);
      },
      true,
    );
  }
  atualizarParticipantes(): void {
    if (!this.ehCriador()) return;
    const divisao = this.selecionado();
    this.participantes.markAllAsTouched();
    if (!divisao || this.participantes.invalid || !this.participantes.length) return;
    const participantes = this.participantes
      .getRawValue()
      .flatMap((valor) =>
        valor.usuarioId !== null
          ? [{ usuarioId: valor.usuarioId, percentual: valor.percentual }]
          : [],
      );
    this.confirmar(
      'Atualizar os participantes e percentuais? Os snapshots dos lançamentos anteriores serão preservados pelo servidor.',
      () =>
        this.executar(
          this.api.participantes(divisao.id, participantes),
          (valor) => {
            this.selecionado.set(valor);
            this.formularioDivisao.markAsPristine();
            this.atualizarDetalhes();
          },
          true,
        ),
    );
  }
  novaDivisao(): void {
    if (this.salvando()) return;
    const abrir = () => {
      this.selecaoDivisao++;
      this.redefinirComandos();
      this.limparDetalhes();
      this.selecionado.set(null);
      this.mostrarCriacao.set(true);
      this.formularioDivisao.enable({ emitEvent: false });
      this.participantes.clear();
      this.participantes.push(this.formularios.formularioParticipante());
      this.formularioDivisao.reset({ nome: '' });
    };
    if (this.temAlteracoes())
      this.confirmar('Descartar os campos não salvos e criar outra divisão?', abrir);
    else abrir();
  }
  abrirDivisao(id: number): void {
    const abrir = () => {
      const selecao = ++this.selecaoDivisao;
      this.mostrarCriacao.set(false);
      this.selecionado.set(null);
      this.limparDetalhes();
      this.executar(this.api.consultar(id), (divisao) => {
        if (selecao !== this.selecaoDivisao) return;
        this.selecionado.set(divisao);
        this.participantes.clear();
        divisao.participantes.forEach((valor) =>
          this.participantes.push(
            this.formularios.formularioParticipante(valor.usuarioId, valor.percentual),
          ),
        );
        this.formularioDivisao.controls.nome.setValue(divisao.nome);
        this.formularioDivisao.markAsPristine();
        if (this.ehCriador()) this.formularioDivisao.enable({ emitEvent: false });
        else this.formularioDivisao.disable({ emitEvent: false });
        this.atualizarDetalhes();
      });
    };
    if (this.temAlteracoes())
      this.confirmar('Trocar de divisão e descartar os campos não salvos?', () => {
        this.redefinirComandos();
        abrir();
      });
    else abrir();
  }
  private limparDetalhes(): void {
    this.resumo.set(null);
    this.historico.set([]);
    this.pendencias.set([]);
    this.reembolsos.set([]);
    this.pagamento.set(null);
    this.alocacoes.set([]);
    this.transacao.set(null);
  }
  private redefinirComandos(): void {
    this.formularios.redefinirComandos();
  }
  atualizarDetalhes(): void {
    const divisao = this.selecionado();
    if (!divisao) return;
    const id = divisao.id;
    const selecao = this.selecaoDivisao;
    const detalhar = ++this.selecaoDetalhe;
    this.carregarResumo();
    this.executar(this.api.historico(id), (linhas) => {
      if (
        selecao === this.selecaoDivisao &&
        detalhar === this.selecaoDetalhe &&
        this.selecionado()?.id === id
      )
        this.historico.set(linhas);
    });
    if (this.ehCriador())
      this.executar(this.api.pendencias(id), (linhas) => {
        if (
          selecao === this.selecaoDivisao &&
          detalhar === this.selecaoDetalhe &&
          this.selecionado()?.id === id
        )
          this.pendencias.set(linhas);
      });
    this.executar(this.api.reembolsos(id), (linhas) => {
      if (
        selecao === this.selecaoDivisao &&
        detalhar === this.selecaoDetalhe &&
        this.selecionado()?.id === id
      )
        this.reembolsos.set(linhas);
    });
  }
  carregarResumo(): void {
    const divisao = this.selecionado();
    this.formularioPeriodo.markAllAsTouched();
    if (!divisao || this.formularioPeriodo.invalid) return;
    const valor = this.formularioPeriodo.getRawValue();
    if (valor.inicio > valor.fim) {
      this.erro.set('A data inicial deve ser anterior à final.');
      return;
    }
    this.resumo.set(null);
    const selecao = ++this.selecaoResumo;
    const selecaoDivisao = this.selecaoDivisao;
    this.executar(this.api.resumo(divisao.id, valor.inicio, valor.fim), (resumo) => {
      if (
        selecao === this.selecaoResumo &&
        selecaoDivisao === this.selecaoDivisao &&
        this.selecionado()?.id === divisao.id
      )
        this.resumo.set(resumo);
    });
  }
  inativar(divisao: DivisaoCompartilhada): void {
    if (divisao.criadorId !== this.usuarioAtualId()) return;
    this.confirmar(`Inativar a divisão ${divisao.nome}? O histórico continuará disponível.`, () =>
      this.executar(
        this.api.inativar(divisao.id),
        () => {
          this.carregar();
          if (this.selecionado()?.id === divisao.id) this.abrirDivisao(divisao.id);
        },
        true,
      ),
    );
  }
  associar(): void {
    const divisao = this.selecionado();
    this.formularioAssociacao.markAllAsTouched();
    const valor = this.formularioAssociacao.getRawValue();
    const responsabilidades = this.formularios.entradaResponsabilidades((mensagem) =>
      this.erro.set(mensagem),
    );
    if (
      !divisao ||
      this.formularioAssociacao.invalid ||
      valor.transacaoId === null ||
      responsabilidades === null
    )
      return;
    this.executar(
      this.api.associar(divisao.id, {
        transacaoId: valor.transacaoId,
        baseCompartilhada: valor.baseCompartilhada,
        responsabilidades: responsabilidades.length ? responsabilidades : null,
      }),
      () => {
        this.formularioAssociacao.markAsPristine();
        this.responsabilidades.markAsPristine();
        this.formularioConsulta.controls.transacaoId.setValue(valor.transacaoId);
        this.consultarTransacao();
        this.atualizarDetalhes();
      },
      true,
    );
  }
  consultarTransacao(): void {
    const divisao = this.selecionado();
    const id = this.formularioConsulta.controls.transacaoId.value;
    this.formularioConsulta.markAllAsTouched();
    if (!divisao || this.formularioConsulta.invalid || id === null) return;
    this.transacao.set(id);
    this.pagamento.set(null);
    this.alocacoes.set([]);
    this.executar(this.api.pagamento(divisao.id, id), (valor) => {
      if (this.transacao() === id && this.selecionado()?.id === divisao.id)
        this.pagamento.set(valor);
    });
    this.executar(this.api.alocacoes(divisao.id, id), (valores) => {
      if (this.transacao() === id && this.selecionado()?.id === divisao.id)
        this.alocacoes.set(valores);
    });
  }
  revisarPendencia(vinculo: AssociacaoPendente): void {
    this.formularioConsulta.controls.transacaoId.setValue(vinculo.transacaoId);
    this.consultarTransacao();
    this.responsabilidades.clear();
    this.responsabilidades.push(this.formularios.formularioResponsabilidade());
  }
  revisarResponsabilidades(): void {
    if (!this.ehCriador()) return;
    const divisao = this.selecionado();
    const transacao = this.transacao();
    const valores = this.formularios.entradaResponsabilidades((mensagem) =>
      this.erro.set(mensagem),
    );
    if (!divisao || transacao === null || !valores?.length) return;
    this.confirmar('Confirmar o snapshot de responsabilidades deste lançamento?', () =>
      this.executar(
        this.api.responsabilidades(divisao.id, transacao, valores),
        () => {
          this.responsabilidades.markAsPristine();
          this.atualizarDetalhes();
        },
        true,
      ),
    );
  }
  desassociar(): void {
    if (!this.ehCriador()) return;
    const divisao = this.selecionado();
    const transacao = this.transacao();
    if (!divisao || transacao === null) return;
    this.confirmar('Desassociar esta transação da divisão? Isso não apaga a transação real.', () =>
      this.executar(
        this.api.desassociar(divisao.id, transacao),
        () => {
          this.transacao.set(null);
          this.pagamento.set(null);
          this.alocacoes.set([]);
          this.atualizarDetalhes();
        },
        true,
      ),
    );
  }
  salvarAlocacoes(): void {
    if (!this.ehCriador()) return;
    const divisao = this.selecionado();
    const transacao = this.transacao();
    this.formulariosAlocacao.markAllAsTouched();
    if (
      !divisao ||
      transacao === null ||
      this.formulariosAlocacao.invalid ||
      !this.formulariosAlocacao.length
    )
      return;
    const valores = this.formulariosAlocacao
      .getRawValue()
      .flatMap((valor) =>
        valor.transacaoId !== null && valor.valor !== null
          ? [{ transacaoId: valor.transacaoId, valor: valor.valor }]
          : [],
      );
    this.confirmar('Substituir as alocações atuais pelos pagamentos reais informados?', () =>
      this.executar(
        this.api.substituirAlocacoes(divisao.id, transacao, valores),
        (linhas) => {
          this.alocacoes.set(linhas);
          this.formulariosAlocacao.markAsPristine();
          this.consultarTransacao();
          this.atualizarDetalhes();
        },
        true,
      ),
    );
  }
  cancelarAlocacao(linha: Alocacao): void {
    if (!this.ehCriador()) return;
    const divisao = this.selecionado();
    const transacao = this.transacao();
    if (!divisao || transacao === null) return;
    this.confirmar('Cancelar esta alocação? A transação de pagamento será preservada.', () =>
      this.executar(
        this.api.cancelarAlocacao(divisao.id, transacao, linha.id),
        () => {
          this.consultarTransacao();
          this.atualizarDetalhes();
        },
        true,
      ),
    );
  }
  registrarReembolso(): void {
    const divisao = this.selecionado();
    this.formularioReembolso.markAllAsTouched();
    const valor = this.formularioReembolso.getRawValue();
    if (
      !divisao ||
      this.formularioReembolso.invalid ||
      valor.transacaoId === null ||
      valor.recebedorId === null ||
      valor.valor === null
    )
      return;
    const reembolsoInput = {
      transacaoId: valor.transacaoId,
      recebedorId: valor.recebedorId,
      valor: valor.valor,
    };
    this.confirmar('Vincular este reembolso à transação real informada?', () =>
      this.executar(
        this.api.registrarReembolso(divisao.id, reembolsoInput),
        () => {
          this.formularioReembolso.reset();
          this.atualizarDetalhes();
        },
        true,
      ),
    );
  }
  cancelarReembolso(linha: Reembolso): void {
    if (!this.ehCriador()) return;
    const divisao = this.selecionado();
    if (!divisao) return;
    this.confirmar('Cancelar o vínculo de reembolso? A transação real será preservada.', () =>
      this.executar(
        this.api.cancelarReembolso(divisao.id, linha.id),
        () => this.atualizarDetalhes(),
        true,
      ),
    );
  }
  alternarAceite(): void {
    const atual = this.aceitouParticipacao();
    if (atual === null) return;
    this.confirmar(
      atual
        ? 'Deixar de aceitar novos compartilhamentos?'
        : 'Aceitar novos compartilhamentos entre usuários?',
      () =>
        this.executar(
          this.api.atualizarAceite(!atual),
          (valor) => this.aceitouParticipacao.set(valor.aceita),
          true,
        ),
    );
  }
}
