import { CurrencyPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableModule } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { finalize, map, type Subscription } from 'rxjs';

import { PAGINACAO_PADRAO, PaginaResponse } from '../../../../core/api/paginacao.model';
import { MensagemGlobalService } from '../../../../core/feedback/mensagem-global.service';
import { ConfirmacaoDialogComponent } from '../../../../shared/ui/confirmacao/confirmacao-dialog';
import { IndicadorProcessamentoComponent } from '../../../../shared/ui/indicador-processamento/indicador-processamento';
import { PageHeaderComponent } from '../../../../shared/ui/page-header/page-header';
import { PaginacaoComponent } from '../../../../shared/ui/paginacao/paginacao';
import {
  criarParametrosDaPagina,
  obterPaginaDaRota,
} from '../../../../shared/routing/paginacao-da-rota';
import { Recorrencia } from '../../recorrencia.model';
import { RecorrenciasApiService } from '../../recorrencias-api.service';
import { FormularioRecorrenciaDialogComponent } from '../formulario-recorrencia/formulario-recorrencia.dialog';

const PAGINA_VAZIA: PaginaResponse<Recorrencia> = {
  conteudo: [],
  pagina: 0,
  tamanho: PAGINACAO_PADRAO.tamanho,
  totalElementos: 0,
  totalPaginas: 0,
};

@Component({
  selector: 'app-lista-recorrencias-page',
  imports: [
    CurrencyPipe,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatMenuModule,
    MatTableModule,
    TranslatePipe,
    IndicadorProcessamentoComponent,
    PageHeaderComponent,
    PaginacaoComponent,
  ],
  templateUrl: './lista-recorrencias.page.html',
  styleUrl: './lista-recorrencias.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListaRecorrenciasPage {
  private readonly api = inject(RecorrenciasApiService);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);
  private readonly mensagens = inject(MensagemGlobalService);
  private readonly translate = inject(TranslateService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private carregamentoAtual?: Subscription;
  private readonly paginaDaRota = toSignal(this.route.queryParamMap.pipe(map(obterPaginaDaRota)), {
    initialValue: obterPaginaDaRota(this.route.snapshot.queryParamMap),
  });

  protected readonly carregando = signal(true);
  protected readonly atualizando = signal(false);
  protected readonly gerandoMes = signal(false);
  protected readonly erro = signal<string | null>(null);
  protected readonly dados = signal(PAGINA_VAZIA);
  protected readonly colunas = ['nome', 'tipo', 'valor', 'dia', 'status', 'acoes'];

  constructor() {
    effect(() => this.carregar({ ...PAGINACAO_PADRAO, pagina: this.paginaDaRota() }));
  }

  protected abrirFormulario(recorrencia?: Recorrencia): void {
    this.dialog
      .open(FormularioRecorrenciaDialogComponent, {
        autoFocus: 'dialog',
        disableClose: true,
        panelClass: 'finisus-cadastro-dialog',
        data: { recorrencia },
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((salvou: boolean | undefined) => {
        if (salvou) this.carregar({ pagina: this.dados().pagina, tamanho: this.dados().tamanho });
      });
  }

  protected gerarMesAtual(): void {
    if (this.gerandoMes()) return;
    const anoMes = new Date()
      .toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' })
      .slice(0, 7);

    this.gerandoMes.set(true);
    this.api
      .gerarMes(anoMes)
      .pipe(
        finalize(() => this.gerandoMes.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (transacoes) =>
          this.mensagens.sucesso(
            transacoes.length
              ? this.translate.instant('PLANEJAMENTO_FINANCEIRO.MENSAGENS.MES_GERADO', {
                  quantidade: transacoes.length,
                  anoMes,
                })
              : this.translate.instant(
                  'PLANEJAMENTO_FINANCEIRO.MENSAGENS.NENHUM_LANCAMENTO_GERADO',
                  { anoMes },
                ),
          ),
        error: () =>
          this.mensagens.erro(
            this.translate.instant('PLANEJAMENTO_FINANCEIRO.MENSAGENS.ERRO_GERAR_MES'),
          ),
      });
  }

  protected confirmarInativacao(recorrencia: Recorrencia): void {
    if (this.atualizando() || !recorrencia.ativo) return;
    this.dialog
      .open(ConfirmacaoDialogComponent, {
        data: {
          titulo: this.translate.instant(
            'PLANEJAMENTO_FINANCEIRO.RECORRENCIAS.CONFIRMACAO_INATIVACAO.TITULO',
          ),
          mensagem: this.translate.instant(
            'PLANEJAMENTO_FINANCEIRO.RECORRENCIAS.CONFIRMACAO_INATIVACAO.MENSAGEM',
            { nome: recorrencia.nome },
          ),
          rotuloConfirmar: this.translate.instant(
            'PLANEJAMENTO_FINANCEIRO.RECORRENCIAS.ACOES.INATIVAR',
          ),
          rotuloCancelar: this.translate.instant('PLANEJAMENTO_FINANCEIRO.ACOES.VOLTAR'),
          tom: 'perigoso',
        },
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmado: boolean | undefined) => {
        if (!confirmado) return;
        this.inativar(recorrencia.id);
      });
  }

  protected navegarParaPagina(pagina: number): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: criarParametrosDaPagina(pagina),
      queryParamsHandling: 'merge',
    });
  }

  protected tentarNovamente(): void {
    this.carregar({ pagina: this.dados().pagina, tamanho: this.dados().tamanho });
  }

  private carregar(paginacao: { readonly pagina: number; readonly tamanho: number }): void {
    this.carregamentoAtual?.unsubscribe();
    this.carregando.set(true);
    this.erro.set(null);
    this.carregamentoAtual = this.api
      .listar(paginacao)
      .pipe(
        finalize(() => this.carregando.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (dados) => this.dados.set(dados),
        error: () =>
          this.erro.set(this.translate.instant('PLANEJAMENTO_FINANCEIRO.MENSAGENS.ERRO_CARREGAR')),
      });
  }

  private inativar(id: number): void {
    if (this.atualizando()) return;
    this.atualizando.set(true);
    this.api
      .inativar(id)
      .pipe(
        finalize(() => this.atualizando.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.mensagens.sucesso(
            this.translate.instant('PLANEJAMENTO_FINANCEIRO.MENSAGENS.RECORRENCIA_INATIVADA'),
          );
          this.carregar({ pagina: this.dados().pagina, tamanho: this.dados().tamanho });
        },
        error: () =>
          this.mensagens.erro(
            this.translate.instant('PLANEJAMENTO_FINANCEIRO.MENSAGENS.ERRO_INATIVAR_RECORRENCIA'),
          ),
      });
  }
}
