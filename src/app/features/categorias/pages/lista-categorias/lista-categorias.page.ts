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
import { EMPTY, catchError, finalize, map, switchMap } from 'rxjs';
import type { Subscription } from 'rxjs';

import { PAGINACAO_PADRAO, PaginaResponse } from '../../../../core/api/paginacao.model';
import { MensagemGlobalService } from '../../../../core/feedback/mensagem-global.service';
import {
  ConfirmacaoDialogComponent,
  ConfirmacaoDialogData,
} from '../../../../shared/ui/confirmacao/confirmacao-dialog';
import { IndicadorProcessamentoComponent } from '../../../../shared/ui/indicador-processamento/indicador-processamento';
import { PaginacaoComponent } from '../../../../shared/ui/paginacao/paginacao';
import { PageHeaderComponent } from '../../../../shared/ui/page-header/page-header';
import {
  criarParametrosDaPagina,
  obterPaginaDaRota,
} from '../../../../shared/routing/paginacao-da-rota';
import { Categoria } from '../../categoria.model';
import { CategoriasApiService } from '../../categorias-api.service';
import { FormularioCategoriaDialogComponent } from '../formulario-categoria/formulario-categoria.dialog';

@Component({
  selector: 'app-lista-categorias',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTableModule,
    TranslatePipe,
    IndicadorProcessamentoComponent,
    PaginacaoComponent,
    PageHeaderComponent,
  ],
  templateUrl: './lista-categorias.page.html',
  styleUrl: './lista-categorias.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListaCategoriasPage {
  private readonly api = inject(CategoriasApiService);
  private readonly dialog = inject(MatDialog);
  private readonly mensagens = inject(MensagemGlobalService);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private carregamentoAtual?: Subscription;
  private readonly paginaDaRota = toSignal(this.route.queryParamMap.pipe(map(obterPaginaDaRota)), {
    initialValue: obterPaginaDaRota(this.route.snapshot.queryParamMap),
  });
  protected readonly dados = signal<PaginaResponse<Categoria>>(paginaVazia());
  protected readonly carregando = signal(true);
  protected readonly erro = signal<string | null>(null);
  protected readonly excluindo = signal(false);
  protected readonly colunas = ['nome', 'categoriaPai', 'acoes'];
  constructor() {
    effect(() => this.carregar({ ...PAGINACAO_PADRAO, pagina: this.paginaDaRota() }));
  }
  protected abrirFormulario(categoria?: Categoria): void {
    this.dialog
      .open(FormularioCategoriaDialogComponent, {
        data: { categoria },
        autoFocus: 'first-tabbable',
        disableClose: true,
        panelClass: 'finisus-cadastro-dialog',
        width: '42rem',
        maxWidth: 'calc(100vw - 2rem)',
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((alterado: boolean | undefined) => {
        if (alterado) {
          this.carregar({ pagina: this.dados().pagina, tamanho: this.dados().tamanho });
        }
      });
  }
  protected excluir(categoria: Categoria): void {
    if (this.excluindo()) {
      return;
    }
    const dados: ConfirmacaoDialogData = {
      titulo: this.translate.instant('CADASTROS.CONFIRMACAO_EXCLUSAO.TITULO'),
      mensagem: this.translate.instant('CADASTROS.CONFIRMACAO_EXCLUSAO.MENSAGEM', {
        nome: categoria.nome,
      }),
      rotuloConfirmar: this.translate.instant('COMPARTILHADO.ACOES.EXCLUIR'),
      rotuloCancelar: this.translate.instant('COMPARTILHADO.ACOES.CANCELAR'),
      tom: 'perigoso',
    };
    this.dialog
      .open(ConfirmacaoDialogComponent, {
        data: dados,
        autoFocus: 'dialog',
        panelClass: 'finisus-dialog',
      })
      .afterClosed()
      .pipe(
        switchMap((confirmado: boolean | undefined) => {
          if (!confirmado) {
            return EMPTY;
          }
          this.excluindo.set(true);
          return this.api.inativar(categoria.id).pipe(
            finalize(() => this.excluindo.set(false)),
            catchError((erro: unknown) => {
              this.mensagens.erro(this.mensagemDeErro(erro));
              return EMPTY;
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.mensagens.sucesso(
          this.translate.instant('CADASTROS.MENSAGENS.EXCLUIDO_COM_SUCESSO', {
            nome: categoria.nome,
          }),
        );
        this.carregar({ pagina: this.dados().pagina, tamanho: this.dados().tamanho });
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
        error: (erro: unknown) => this.erro.set(this.mensagemDeErro(erro)),
      });
  }
  private mensagemDeErro(erro: unknown): string {
    return erro instanceof HttpErrorResponse && typeof erro.error?.detail === 'string'
      ? erro.error.detail
      : this.translate.instant('CADASTROS.MENSAGENS.ERRO_CARREGAR');
  }
}
function paginaVazia(): PaginaResponse<Categoria> {
  return { ...PAGINACAO_PADRAO, conteudo: [], totalElementos: 0, totalPaginas: 0 };
}
