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
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import {
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { finalize, map } from 'rxjs';

import { PAGINACAO_PADRAO } from '../../../../core/api/paginacao.model';
import { CampoFormularioComponent } from '../../../../shared/ui/campo-formulario/campo-formulario';
import {
  ConfirmacaoDialogComponent,
  ConfirmacaoDialogData,
} from '../../../../shared/ui/confirmacao/confirmacao-dialog';
import { FocoAcessivelService } from '../../../../shared/ui/foco/foco-acessivel.service';
import { IndicadorProcessamentoComponent } from '../../../../shared/ui/indicador-processamento/indicador-processamento';
import { MensagemGlobalService } from '../../../../shared/ui/mensagem-global/mensagem-global.service';
import { obterConfiguracaoCadastro } from '../../cadastros.config';
import { obterValidadoresCampo } from '../../cadastros.validators';
import {
  CampoCadastro,
  ConfiguracaoCadastro,
  RegistroCadastro,
  RequisicaoCadastro,
  TipoConta,
} from '../../cadastros.models';
import { CadastrosApiService } from '../../data-access/cadastros-api.service';

interface OpcoesPorOrigem {
  readonly bancos: readonly RegistroCadastro[];
  readonly categorias: readonly RegistroCadastro[];
}

interface ControlesFormularioCadastro {
  readonly nome: FormControl<string>;
  readonly codigo: FormControl<string>;
  readonly tipo: FormControl<TipoConta | null>;
  readonly bancoId: FormControl<number | null>;
  readonly categoriaPaiId: FormControl<number | null>;
  readonly categoriaPadraoId: FormControl<number | null>;
}

interface SecaoFormularioCadastro {
  readonly titulo: string;
  readonly descricao?: string;
  readonly campos: readonly CampoCadastro[];
}

const DESCRICOES_DAS_SECOES: Readonly<Record<string, string>> = {
  'CADASTROS.FORMULARIO.SECOES.IDENTIFICACAO':
    'CADASTROS.FORMULARIO.DESCRICOES_SECOES.IDENTIFICACAO',
  'CADASTROS.FORMULARIO.SECOES.VINCULOS': 'CADASTROS.FORMULARIO.DESCRICOES_SECOES.VINCULOS',
  'CADASTROS.FORMULARIO.SECOES.HIERARQUIA': 'CADASTROS.FORMULARIO.DESCRICOES_SECOES.HIERARQUIA',
  'CADASTROS.FORMULARIO.SECOES.CLASSIFICACAO':
    'CADASTROS.FORMULARIO.DESCRICOES_SECOES.CLASSIFICACAO',
};

export interface DadosFormularioCadastro {
  readonly configuracao: ConfiguracaoCadastro;
  readonly id?: number;
}

@Component({
  selector: 'app-formulario-cadastro',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    TranslatePipe,
    CampoFormularioComponent,
    IndicadorProcessamentoComponent,
  ],
  templateUrl: './formulario-cadastro.page.html',
  styleUrl: './formulario-cadastro.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormularioCadastroPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly apiService = inject(CadastrosApiService);
  private readonly mensagemGlobalService = inject(MensagemGlobalService);
  private readonly focoAcessivelService = inject(FocoAcessivelService);
  private readonly translateService = inject(TranslateService);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dadosDialogo = inject<DadosFormularioCadastro | null>(MAT_DIALOG_DATA, {
    optional: true,
  });
  private readonly dialogRef = inject(MatDialogRef<FormularioCadastroPage>, { optional: true });

  protected readonly configuracao = signal<ConfiguracaoCadastro | null>(null);
  protected readonly idEmEdicao = signal<number | null>(null);
  protected readonly carregando = signal(false);
  protected readonly formularioEnviado = signal(false);
  protected readonly mensagem = signal<string | null>(null);
  protected readonly opcoesPorOrigem = signal<OpcoesPorOrigem>({ bancos: [], categorias: [] });
  protected readonly origensComCarregamentoEmAndamento = signal<
    ReadonlySet<NonNullable<CampoCadastro['origemDasOpcoes']>>
  >(new Set());
  protected readonly estaEmDialogo = this.dadosDialogo !== null;

  protected readonly formulario: FormGroup<ControlesFormularioCadastro> = this.formBuilder.group({
    nome: this.formBuilder.control('', Validators.required),
    codigo: this.formBuilder.control(''),
    tipo: this.formBuilder.control<TipoConta | null>(null),
    bancoId: this.formBuilder.control<number | null>(null),
    categoriaPaiId: this.formBuilder.control<number | null>(null),
    categoriaPadraoId: this.formBuilder.control<number | null>(null),
  });

  protected readonly secoes = computed<readonly SecaoFormularioCadastro[]>(() => {
    const configuracao = this.configuracao();
    if (!configuracao) {
      return [];
    }

    const secoes = new Map<string, CampoCadastro[]>();
    for (const campo of configuracao.campos) {
      secoes.set(campo.secao, [...(secoes.get(campo.secao) ?? []), campo]);
    }

    return Array.from(secoes, ([titulo, campos]) => ({
      titulo,
      descricao: DESCRICOES_DAS_SECOES[titulo],
      campos,
    }));
  });

  constructor() {
    if (this.dadosDialogo) {
      this.inicializar(this.dadosDialogo.configuracao, this.dadosDialogo.id ?? null);
      return;
    }

    this.route.paramMap
      .pipe(
        map((parametros) => ({
          configuracao: obterConfiguracaoCadastro(parametros.get('tipo')),
          id: converterId(parametros.get('id')),
        })),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(({ configuracao, id }) => {
        if (!configuracao) {
          void this.router.navigateByUrl('/dashboard');
          return;
        }

        this.inicializar(configuracao, id);
      });
  }

  protected salvar(): void {
    const configuracao = this.configuracao();

    this.mensagem.set(null);
    this.formularioEnviado.set(true);

    if (!configuracao || this.carregando()) {
      return;
    }

    if (this.formulario.invalid) {
      this.focarPrimeiroCampoInvalido(configuracao);
      return;
    }

    const requisicao = this.montarRequisicao(configuracao);
    if (!requisicao) {
      return;
    }

    this.carregando.set(true);
    const id = this.idEmEdicao();
    const operacao = id
      ? this.apiService.atualizar(configuracao, id, requisicao)
      : this.apiService.criar(configuracao, requisicao);

    operacao
      .pipe(
        finalize(() => this.carregando.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (registro) => {
          const chave = id
            ? 'CADASTROS.MENSAGENS.ATUALIZADO_COM_SUCESSO'
            : 'CADASTROS.MENSAGENS.CRIADO_COM_SUCESSO';
          this.mensagemGlobalService.sucesso(
            this.translateService.instant(chave, { nome: registro.nome }),
          );
          if (this.dialogRef) {
            this.dialogRef.close(true);
            return;
          }

          void this.router.navigate(['/cadastros', configuracao.tipo]);
        },
        error: (erro: unknown) => this.mensagem.set(this.obterMensagemDeErro(erro)),
      });
  }

  protected campoInvalido(campo: CampoCadastro): boolean {
    const controle = this.obterControle(campo.nome);
    return controle.invalid && this.formularioEnviado();
  }

  protected opcoesPara(campo: CampoCadastro): readonly RegistroCadastro[] {
    if (campo.origemDasOpcoes === 'bancos') {
      return this.opcoesPorOrigem().bancos;
    }

    if (campo.origemDasOpcoes === 'categorias') {
      const idAtual = this.idEmEdicao();
      return this.opcoesPorOrigem().categorias.filter((categoria) => categoria.id !== idAtual);
    }

    return [];
  }

  protected editando(): boolean {
    return this.idEmEdicao() !== null;
  }

  protected cancelar(): void {
    if (this.carregando()) {
      return;
    }

    if (!this.formulario.dirty) {
      this.fecharSemSalvar();
      return;
    }

    const dados: ConfirmacaoDialogData = {
      titulo: this.translateService.instant('CADASTROS.CONFIRMACAO_DESCARTE.TITULO'),
      mensagem: this.translateService.instant('CADASTROS.CONFIRMACAO_DESCARTE.MENSAGEM'),
      rotuloConfirmar: this.translateService.instant('CADASTROS.CONFIRMACAO_DESCARTE.CONFIRMAR'),
      rotuloCancelar: this.translateService.instant('COMPARTILHADO.ACOES.CANCELAR'),
    };

    this.dialog
      .open(ConfirmacaoDialogComponent, {
        data: dados,
        autoFocus: 'dialog',
        panelClass: 'finisus-dialog',
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmado: boolean | undefined) => {
        if (confirmado) {
          this.fecharSemSalvar();
        }
      });
  }

  private inicializar(configuracao: ConfiguracaoCadastro, id: number | null): void {
    this.configuracao.set(configuracao);
    this.idEmEdicao.set(id);
    this.configurarValidacoes(configuracao);
    this.carregarOpcoes(configuracao);

    if (id) {
      this.carregarRegistro(configuracao, id);
    }
  }

  private configurarValidacoes(configuracao: ConfiguracaoCadastro): void {
    this.formulario.reset({
      nome: '',
      codigo: '',
      tipo: null,
      bancoId: null,
      categoriaPaiId: null,
      categoriaPadraoId: null,
    });
    this.formularioEnviado.set(false);

    for (const campo of configuracao.campos) {
      this.obterControle(campo.nome).setValidators(obterValidadoresCampo(campo));
      this.obterControle(campo.nome).updateValueAndValidity({ emitEvent: false });
    }
  }

  private carregarOpcoes(configuracao: ConfiguracaoCadastro): void {
    const origens = new Set(
      configuracao.campos.flatMap((campo) =>
        campo.origemDasOpcoes ? [campo.origemDasOpcoes] : [],
      ),
    );

    this.opcoesPorOrigem.set({ bancos: [], categorias: [] });
    this.origensComCarregamentoEmAndamento.set(origens);
    for (const origem of origens) {
      const configuracaoDaOrigem = obterConfiguracaoCadastro(origem);
      if (!configuracaoDaOrigem) {
        continue;
      }

      this.apiService
        .listar(configuracaoDaOrigem, { ...PAGINACAO_PADRAO, tamanho: 100 })
        .pipe(
          finalize(() => this.removerOrigemDoCarregamento(origem)),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe({
          next: (pagina) => {
            this.opcoesPorOrigem.update((opcoesAtuais) => ({
              ...opcoesAtuais,
              [origem]: pagina.conteudo,
            }));
          },
          error: (erro: unknown) => this.mensagemGlobalService.erro(this.obterMensagemDeErro(erro)),
        });
    }
  }

  private carregarRegistro(configuracao: ConfiguracaoCadastro, id: number): void {
    this.carregando.set(true);
    this.apiService
      .buscar(configuracao, id)
      .pipe(
        finalize(() => this.carregando.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (registro) =>
          this.formulario.patchValue({
            nome: registro.nome,
            codigo: registro.codigo ?? '',
            tipo: registro.tipo ?? null,
            bancoId: registro.bancoId ?? null,
            categoriaPaiId: registro.categoriaPaiId ?? null,
            categoriaPadraoId: registro.categoriaPadraoId ?? null,
          }),
        error: (erro: unknown) => this.mensagem.set(this.obterMensagemDeErro(erro)),
      });
  }

  private montarRequisicao(configuracao: ConfiguracaoCadastro): RequisicaoCadastro | null {
    const valores = this.formulario.getRawValue();
    const nome = valores.nome.trim();

    switch (configuracao.tipo) {
      case 'bancos':
        return { nome, codigo: valores.codigo.trim() };
      case 'contas':
        return valores.tipo
          ? { nome, tipo: valores.tipo, ...(valores.bancoId ? { bancoId: valores.bancoId } : {}) }
          : null;
      case 'categorias':
        return {
          nome,
          ...(valores.categoriaPaiId ? { categoriaPaiId: valores.categoriaPaiId } : {}),
        };
      case 'itens':
        return {
          nome,
          ...(valores.categoriaPadraoId ? { categoriaPadraoId: valores.categoriaPadraoId } : {}),
        };
      case 'meios-pagamento':
        return { nome };
    }
  }

  private obterControle(nome: CampoCadastro['nome']) {
    return this.formulario.controls[nome];
  }

  private focarPrimeiroCampoInvalido(configuracao: ConfiguracaoCadastro): void {
    const primeiroCampoInvalido = configuracao.campos.find(
      (campo) => this.obterControle(campo.nome).invalid,
    );

    if (primeiroCampoInvalido) {
      this.focoAcessivelService.focarPorId(`${configuracao.tipo}-${primeiroCampoInvalido.nome}`);
    }
  }

  private fecharSemSalvar(): void {
    if (this.dialogRef) {
      this.dialogRef.close(false);
      return;
    }

    const configuracao = this.configuracao();
    void this.router.navigate(['/cadastros', configuracao?.tipo ?? 'bancos']);
  }

  private removerOrigemDoCarregamento(origem: NonNullable<CampoCadastro['origemDasOpcoes']>): void {
    this.origensComCarregamentoEmAndamento.update((origensAtuais) => {
      const origensAtualizadas = new Set(origensAtuais);
      origensAtualizadas.delete(origem);

      return origensAtualizadas;
    });
  }

  private obterMensagemDeErro(erro: unknown): string {
    if (erro instanceof HttpErrorResponse) {
      if (erro.status === 0) {
        return this.translateService.instant('COMPARTILHADO.MENSAGENS.ERRO_CONEXAO_BACKEND');
      }
      if (typeof erro.error?.detail === 'string') {
        return erro.error.detail;
      }
    }

    return this.translateService.instant('CADASTROS.MENSAGENS.ERRO_SALVAR');
  }
}

function converterId(valor: string | null): number | null {
  const id = Number(valor);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}
