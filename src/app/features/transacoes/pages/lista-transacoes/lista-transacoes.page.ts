import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
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
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableModule } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { finalize, map } from 'rxjs';
import type { Subscription } from 'rxjs';

import { PAGINACAO_PADRAO, PaginaResponse } from '../../../../core/api/paginacao.model';
import {
  ConfirmacaoDialogComponent,
  ConfirmacaoDialogData,
} from '../../../../shared/ui/confirmacao/confirmacao-dialog';
import { IndicadorProcessamentoComponent } from '../../../../shared/ui/indicador-processamento/indicador-processamento';
import { MensagemGlobalService } from '../../../../core/feedback/mensagem-global.service';
import { PaginacaoComponent } from '../../../../shared/ui/paginacao/paginacao';
import { PageHeaderComponent } from '../../../../shared/ui/page-header/page-header';
import {
  criarParametrosDaPagina,
  obterPaginaDaRota,
} from '../../../../shared/routing/paginacao-da-rota';
import { FormularioTransacaoPage } from '../formulario-transacao/formulario-transacao.page';
import { HistoricoTransacao, Transacao } from '../../transacoes.models';
import { TransacoesApiService } from '../../data-access/transacoes-api.service';

@Component({
  selector: 'app-lista-transacoes',
  imports: [
    CurrencyPipe,
    DatePipe,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTableModule,
    TranslatePipe,
    IndicadorProcessamentoComponent,
    PaginacaoComponent,
    PageHeaderComponent,
  ],
  templateUrl: './lista-transacoes.page.html',
  styleUrl: './lista-transacoes.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListaTransacoesPage {
  private readonly apiService = inject(TransacoesApiService);
  private readonly dialog = inject(MatDialog);
  private readonly mensagemGlobalService = inject(MensagemGlobalService);
  private readonly translateService = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private carregamentoAtual?: Subscription;
  private readonly paginaDaRota = toSignal(this.route.queryParamMap.pipe(map(obterPaginaDaRota)), {
    initialValue: obterPaginaDaRota(this.route.snapshot.queryParamMap),
  });

  protected readonly dados = signal<PaginaResponse<Transacao>>({
    ...PAGINACAO_PADRAO,
    conteudo: [],
    totalElementos: 0,
    totalPaginas: 0,
  });
  protected readonly carregando = signal(true);
  protected readonly erro = signal<string | null>(null);
  protected readonly transacaoDoHistorico = signal<Transacao | null>(null);
  protected readonly historico = signal<readonly HistoricoTransacao[]>([]);
  protected readonly carregandoHistorico = signal(false);
  protected readonly colunas = ['tipo', 'data', 'descricao', 'valor', 'conta', 'acoes'];
  protected readonly colunasHistorico = ['campo', 'anterior', 'novo', 'data'];

  constructor() {
    effect(() => this.carregar({ ...PAGINACAO_PADRAO, pagina: this.paginaDaRota() }));
  }

  protected abrirFormulario(transacao?: Transacao): void {
    this.dialog
      .open(FormularioTransacaoPage, {
        data: { transacao },
        disableClose: true,
        panelClass: 'finisus-cadastro-dialog',
        width: '46rem',
        maxWidth: 'calc(100vw - 2rem)',
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((alterada: boolean | undefined) => {
        if (alterada) {
          this.carregar({ pagina: this.dados().pagina, tamanho: this.dados().tamanho });
        }
      });
  }

  protected estornar(transacao: Transacao): void {
    const dados: ConfirmacaoDialogData = {
      titulo: this.translateService.instant('TRANSACOES.CONFIRMACAO_ESTORNO.TITULO'),
      mensagem: this.translateService.instant('TRANSACOES.CONFIRMACAO_ESTORNO.MENSAGEM', {
        descricao: transacao.descricao,
      }),
      rotuloCancelar: this.translateService.instant('COMPARTILHADO.ACOES.CANCELAR'),
      rotuloConfirmar: this.translateService.instant('TRANSACOES.ACOES.ESTORNAR'),
      tom: 'perigoso',
    };
    this.dialog
      .open(ConfirmacaoDialogComponent, {
        data: dados,
        panelClass: 'finisus-dialog',
        autoFocus: 'dialog',
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmado: boolean | undefined) => {
        if (!confirmado) {
          return;
        }
        this.apiService
          .estornar(transacao.id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.mensagemGlobalService.sucesso(
                this.translateService.instant('TRANSACOES.MENSAGENS.ESTORNADA'),
              );
              this.carregar({ pagina: this.dados().pagina, tamanho: this.dados().tamanho });
            },
            error: (erro: unknown) => this.mensagemGlobalService.erro(this.mensagemDeErro(erro)),
          });
      });
  }

  protected abrirHistorico(transacao: Transacao): void {
    this.transacaoDoHistorico.set(transacao);
    this.carregandoHistorico.set(true);
    this.apiService
      .listarHistorico(transacao.id, PAGINACAO_PADRAO)
      .pipe(
        finalize(() => this.carregandoHistorico.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (pagina) => this.historico.set(pagina.conteudo),
        error: (erro: unknown) => this.mensagemGlobalService.erro(this.mensagemDeErro(erro)),
      });
  }

  protected fecharHistorico(): void {
    this.transacaoDoHistorico.set(null);
    this.historico.set([]);
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
    this.carregamentoAtual = this.apiService
      .listar(paginacao)
      .pipe(
        finalize(() => this.carregando.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (dados) => this.dados.set(dados),
        error: (erro: unknown) => this.erro.set(this.mensagemDeErro(erro)),
      });
  }

  private mensagemDeErro(erro: unknown): string {
    if (erro instanceof HttpErrorResponse && typeof erro.error?.detail === 'string') {
      return erro.error.detail;
    }
    return this.translateService.instant('TRANSACOES.MENSAGENS.ERRO_CARREGAR');
  }
}
