import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { EMPTY, catchError, finalize, map, switchMap } from 'rxjs';

import { PAGINACAO_PADRAO, PaginaResponse } from '../../../../core/api/paginacao.model';
import {
  ConfirmacaoDialogComponent,
  ConfirmacaoDialogData,
} from '../../../../shared/ui/confirmacao/confirmacao-dialog';
import { IndicadorProcessamentoComponent } from '../../../../shared/ui/indicador-processamento/indicador-processamento';
import { MensagemGlobalService } from '../../../../shared/ui/mensagem-global/mensagem-global.service';
import { PaginacaoComponent } from '../../../../shared/ui/paginacao/paginacao';
import { PageHeaderComponent } from '../../../../shared/ui/page-header/page-header';
import { obterConfiguracaoCadastro } from '../../cadastros.config';
import { ConfiguracaoCadastro, RegistroCadastro } from '../../cadastros.models';
import { CadastrosApiService } from '../../data-access/cadastros-api.service';
import {
  DadosFormularioCadastro,
  FormularioCadastroPage,
} from '../formulario-cadastro/formulario-cadastro.page';

@Component({
  selector: 'app-lista-cadastros',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTableModule,
    MatTooltipModule,
    TranslatePipe,
    IndicadorProcessamentoComponent,
    PaginacaoComponent,
    PageHeaderComponent,
  ],
  templateUrl: './lista-cadastros.page.html',
  styleUrl: './lista-cadastros.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListaCadastrosPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly apiService = inject(CadastrosApiService);
  private readonly dialog = inject(MatDialog);
  private readonly mensagemGlobalService = inject(MensagemGlobalService);
  private readonly translateService = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly configuracao = signal<ConfiguracaoCadastro | null>(null);
  protected readonly dados = signal<PaginaResponse<RegistroCadastro>>({
    conteudo: [],
    pagina: 0,
    tamanho: PAGINACAO_PADRAO.tamanho,
    totalElementos: 0,
    totalPaginas: 0,
  });
  protected readonly carregando = signal(false);
  protected readonly excluindo = signal(false);
  protected readonly erroCarregamento = signal<string | null>(null);
  protected readonly erroDePermissao = signal(false);
  protected readonly colunas = computed(() =>
    this.configuracao()?.tipo === 'meios-pagamento'
      ? ['nome', 'acoes']
      : ['nome', 'detalhes', 'acoes'],
  );

  constructor() {
    this.route.paramMap
      .pipe(
        map((parametros) => obterConfiguracaoCadastro(parametros.get('tipo'))),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((configuracao) => {
        if (!configuracao) {
          void this.router.navigateByUrl('/dashboard');
          return;
        }

        this.configuracao.set(configuracao);
        this.carregar(PAGINACAO_PADRAO);
      });
  }

  protected navegarParaPagina(pagina: number): void {
    this.carregar({ pagina, tamanho: this.dados().tamanho });
  }

  protected tentarNovamente(): void {
    this.carregar({ pagina: this.dados().pagina, tamanho: this.dados().tamanho });
  }

  protected abrirFormulario(registro?: RegistroCadastro): void {
    const configuracao = this.configuracao();
    if (!configuracao) {
      return;
    }

    const dados: DadosFormularioCadastro = {
      configuracao,
      ...(registro ? { id: registro.id } : {}),
    };

    this.dialog
      .open(FormularioCadastroPage, {
        data: dados,
        autoFocus: 'first-tabbable',
        disableClose: true,
        ariaLabel: this.translateService.instant(configuracao.rotuloSingular),
        maxWidth: 'calc(100vw - 2rem)',
        panelClass: 'finisus-cadastro-dialog',
        width: '48rem',
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((alterado: boolean | undefined) => {
        if (alterado) {
          this.carregar({ pagina: this.dados().pagina, tamanho: this.dados().tamanho });
        }
      });
  }

  protected excluir(registro: RegistroCadastro): void {
    const configuracao = this.configuracao();

    if (!configuracao || this.excluindo()) {
      return;
    }

    const dadosDialogo: ConfirmacaoDialogData = {
      titulo: this.translateService.instant('CADASTROS.CONFIRMACAO_EXCLUSAO.TITULO'),
      mensagem: this.translateService.instant('CADASTROS.CONFIRMACAO_EXCLUSAO.MENSAGEM', {
        nome: registro.nome,
      }),
      rotuloConfirmar: this.translateService.instant('COMPARTILHADO.ACOES.EXCLUIR'),
      rotuloCancelar: this.translateService.instant('COMPARTILHADO.ACOES.CANCELAR'),
      tom: 'perigoso',
    };

    this.dialog
      .open(ConfirmacaoDialogComponent, {
        data: dadosDialogo,
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
          return this.apiService.inativar(configuracao, registro.id).pipe(
            finalize(() => this.excluindo.set(false)),
            catchError((erro: unknown) => {
              this.mensagemGlobalService.erro(this.obterMensagemDeErro(erro));
              return EMPTY;
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.mensagemGlobalService.sucesso(
          this.translateService.instant('CADASTROS.MENSAGENS.EXCLUIDO_COM_SUCESSO', {
            nome: registro.nome,
          }),
        );
        this.carregar({ pagina: this.dados().pagina, tamanho: this.dados().tamanho });
      });
  }

  protected descricaoDoRegistro(registro: RegistroCadastro): string {
    const configuracao = this.configuracao();

    if (!configuracao) {
      return '';
    }

    switch (configuracao.tipo) {
      case 'bancos':
        return registro.codigo ?? '';
      case 'contas':
        return `${this.rotuloTipoConta(registro.tipo)} · ${this.formatarValor(registro.saldo)}`;
      case 'categorias':
        return registro.categoriaPaiId
          ? this.translateService.instant('CADASTROS.DETALHES.CATEGORIA_PAI', {
              id: registro.categoriaPaiId,
            })
          : this.translateService.instant('CADASTROS.DETALHES.SEM_CATEGORIA_PAI');
      case 'itens':
        return registro.categoriaPadraoId
          ? this.translateService.instant('CADASTROS.DETALHES.CATEGORIA_PADRAO', {
              id: registro.categoriaPadraoId,
            })
          : this.translateService.instant('CADASTROS.DETALHES.SEM_CATEGORIA_PADRAO');
      case 'meios-pagamento':
        return '';
    }
  }

  protected readonly rotuloDoDetalhe = computed(() => {
    switch (this.configuracao()?.tipo) {
      case 'bancos':
        return 'CADASTROS.CAMPOS.CODIGO';
      case 'contas':
        return 'CADASTROS.CAMPOS.TIPO_E_SALDO';
      case 'categorias':
        return 'CADASTROS.CAMPOS.CATEGORIA_PAI';
      case 'itens':
        return 'CADASTROS.CAMPOS.CATEGORIA_PADRAO';
      case 'meios-pagamento':
        return '';
      default:
        return '';
    }
  });

  private carregar(paginacao: { readonly pagina: number; readonly tamanho: number }): void {
    const configuracao = this.configuracao();

    if (!configuracao) {
      return;
    }

    this.carregando.set(true);
    this.erroCarregamento.set(null);
    this.erroDePermissao.set(false);
    this.apiService
      .listar(configuracao, paginacao)
      .pipe(
        finalize(() => this.carregando.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (dados) => this.dados.set(dados),
        error: (erro: unknown) => {
          const mensagem = this.obterMensagemDeErro(erro);
          this.erroCarregamento.set(mensagem);
          this.erroDePermissao.set(erro instanceof HttpErrorResponse && erro.status === 403);
          this.mensagemGlobalService.erro(mensagem);
        },
      });
  }

  private rotuloTipoConta(tipo: RegistroCadastro['tipo']): string {
    return tipo ? this.translateService.instant(`CADASTROS.TIPOS_CONTA.${tipo}`) : '';
  }

  private formatarValor(valor: number | undefined): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
      valor ?? 0,
    );
  }

  private obterMensagemDeErro(erro: unknown): string {
    if (erro instanceof HttpErrorResponse) {
      if (erro.status === 0) {
        return this.translateService.instant('COMPARTILHADO.MENSAGENS.ERRO_CONEXAO_BACKEND');
      }

      if (erro.status === 403) {
        return this.translateService.instant('CADASTROS.MENSAGENS.SEM_PERMISSAO_DESCRICAO');
      }

      if (typeof erro.error?.detail === 'string') {
        return erro.error.detail;
      }
    }

    return this.translateService.instant('CADASTROS.MENSAGENS.ERRO_CARREGAR');
  }
}
