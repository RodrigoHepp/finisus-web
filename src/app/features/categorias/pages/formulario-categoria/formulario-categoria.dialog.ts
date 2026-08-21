import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs';

import { FocoAcessivelService } from '../../../../core/accessibility/foco-acessivel.service';
import { MensagemGlobalService } from '../../../../core/feedback/mensagem-global.service';
import { validarTextoObrigatorio } from '../../../../shared/forms/texto-obrigatorio.validators';
import {
  ReferenciaFinanceira,
  ReferenciasFinanceirasApiService,
} from '../../../../core/api/referencias-financeiras-api.service';
import { CampoFormularioComponent } from '../../../../shared/ui/campo-formulario/campo-formulario';
import { CabecalhoDialogoFormularioComponent } from '../../../../shared/ui/cabecalho-dialogo-formulario/cabecalho-dialogo-formulario';
import { MensagemValidacaoComponent } from '../../../../shared/ui/mensagem-validacao/mensagem-validacao';
import {
  ConfirmacaoDialogComponent,
  ConfirmacaoDialogData,
} from '../../../../shared/ui/confirmacao/confirmacao-dialog';
import { Categoria, CategoriaRequest } from '../../categoria.model';
import { CategoriasApiService } from '../../categorias-api.service';

export interface DadosFormularioCategoria {
  readonly categoria?: Categoria;
}
interface ControlesFormularioCategoria {
  readonly nome: FormControl<string>;
  readonly categoriaPaiId: FormControl<number | null>;
}
@Component({
  selector: 'app-formulario-categoria-dialog',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    TranslatePipe,
    CampoFormularioComponent,
    CabecalhoDialogoFormularioComponent,
    MensagemValidacaoComponent,
  ],
  templateUrl: './formulario-categoria.dialog.html',
  styleUrl: './formulario-categoria.dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormularioCategoriaDialogComponent {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly api = inject(CategoriasApiService);
  private readonly referenciasApi = inject(ReferenciasFinanceirasApiService);
  private readonly foco = inject(FocoAcessivelService);
  private readonly mensagens = inject(MensagemGlobalService);
  private readonly dialog = inject(MatDialog);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dados = inject<DadosFormularioCategoria>(MAT_DIALOG_DATA);
  protected readonly dialogRef = inject(MatDialogRef<FormularioCategoriaDialogComponent>);
  protected readonly categorias = signal<readonly ReferenciaFinanceira[]>([]);
  protected readonly carregandoCategorias = signal(true);
  protected readonly enviando = signal(false);
  protected readonly enviado = signal(false);
  protected readonly mensagem = signal<string | null>(null);
  protected readonly editando = this.dados.categoria !== undefined;
  protected readonly formulario: FormGroup<ControlesFormularioCategoria> = this.formBuilder.group({
    nome: this.formBuilder.control(this.dados.categoria?.nome ?? '', [
      Validators.required,
      validarTextoObrigatorio(),
      Validators.maxLength(100),
    ]),
    categoriaPaiId: this.formBuilder.control<number | null>(
      this.dados.categoria?.categoriaPaiId ?? null,
    ),
  });
  constructor() {
    this.referenciasApi
      .listar('categorias')
      .pipe(
        finalize(() => this.carregandoCategorias.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (categorias) =>
          this.categorias.set(
            categorias.filter((categoria) => categoria.id !== this.dados.categoria?.id),
          ),
        error: (erro: unknown) => this.mensagem.set(this.mensagemDeErro(erro)),
      });
  }
  protected salvar(): void {
    this.enviado.set(true);
    this.mensagem.set(null);
    if (this.formulario.invalid || this.enviando()) {
      this.focarPrimeiroInvalido();
      return;
    }
    const valores = this.formulario.getRawValue();
    const requisicao: CategoriaRequest = {
      nome: valores.nome.trim(),
      ...(valores.categoriaPaiId ? { categoriaPaiId: valores.categoriaPaiId } : {}),
    };
    const operacao = this.dados.categoria
      ? this.api.atualizar(this.dados.categoria.id, requisicao)
      : this.api.criar(requisicao);
    this.enviando.set(true);
    operacao
      .pipe(
        finalize(() => this.enviando.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (categoria) => {
          this.mensagens.sucesso(
            this.translate.instant(
              this.dados.categoria
                ? 'CADASTROS.MENSAGENS.ATUALIZADO_COM_SUCESSO'
                : 'CADASTROS.MENSAGENS.CRIADO_COM_SUCESSO',
              { nome: categoria.nome },
            ),
          );
          this.dialogRef.close(true);
        },
        error: (erro: unknown) => this.mensagem.set(this.mensagemDeErro(erro)),
      });
  }
  protected cancelar(): void {
    if (!this.formulario.dirty) {
      this.dialogRef.close(false);
      return;
    }
    const dados: ConfirmacaoDialogData = {
      titulo: this.translate.instant('CADASTROS.CONFIRMACAO_DESCARTE.TITULO'),
      mensagem: this.translate.instant('CADASTROS.CONFIRMACAO_DESCARTE.MENSAGEM'),
      rotuloConfirmar: this.translate.instant('CADASTROS.CONFIRMACAO_DESCARTE.CONFIRMAR'),
      rotuloCancelar: this.translate.instant('COMPARTILHADO.ACOES.CANCELAR'),
      tom: 'perigoso',
    };
    this.dialog
      .open(ConfirmacaoDialogComponent, { data: dados, panelClass: 'finisus-dialog' })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmado: boolean | undefined) => {
        if (confirmado) {
          this.dialogRef.close(false);
        }
      });
  }
  protected campoInvalido(nome: keyof ControlesFormularioCategoria): boolean {
    return this.enviado() && this.formulario.controls[nome].invalid;
  }
  private focarPrimeiroInvalido(): void {
    const nome = (
      Object.keys(this.formulario.controls) as (keyof ControlesFormularioCategoria)[]
    ).find((campo) => this.formulario.controls[campo].invalid);
    if (nome) {
      this.foco.focarPorId(`categoria-${nome}`);
    }
  }
  private mensagemDeErro(erro: unknown): string {
    return erro instanceof HttpErrorResponse && typeof erro.error?.detail === 'string'
      ? erro.error.detail
      : this.translate.instant('CADASTROS.MENSAGENS.ERRO_SALVAR');
  }
}
