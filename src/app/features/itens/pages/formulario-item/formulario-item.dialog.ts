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
import { Item, ItemRequest } from '../../item.model';
import { ItensApiService } from '../../itens-api.service';

export interface DadosFormularioItem {
  readonly item?: Item;
}
interface ControlesFormularioItem {
  readonly nome: FormControl<string>;
  readonly categoriaPadraoId: FormControl<number | null>;
}
@Component({
  selector: 'app-formulario-item-dialog',
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
  templateUrl: './formulario-item.dialog.html',
  styleUrl: './formulario-item.dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormularioItemDialogComponent {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly api = inject(ItensApiService);
  private readonly referenciasApi = inject(ReferenciasFinanceirasApiService);
  private readonly foco = inject(FocoAcessivelService);
  private readonly mensagens = inject(MensagemGlobalService);
  private readonly dialog = inject(MatDialog);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dados = inject<DadosFormularioItem>(MAT_DIALOG_DATA);
  protected readonly dialogRef = inject(MatDialogRef<FormularioItemDialogComponent>);
  protected readonly categorias = signal<readonly ReferenciaFinanceira[]>([]);
  protected readonly carregandoCategorias = signal(true);
  protected readonly enviando = signal(false);
  protected readonly enviado = signal(false);
  protected readonly mensagem = signal<string | null>(null);
  protected readonly editando = this.dados.item !== undefined;
  protected readonly formulario: FormGroup<ControlesFormularioItem> = this.formBuilder.group({
    nome: this.formBuilder.control(this.dados.item?.nome ?? '', [
      Validators.required,
      validarTextoObrigatorio(),
      Validators.maxLength(300),
    ]),
    categoriaPadraoId: this.formBuilder.control<number | null>(
      this.dados.item?.categoriaPadraoId ?? null,
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
        next: (categorias) => this.categorias.set(categorias),
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
    const requisicao: ItemRequest = {
      nome: valores.nome.trim(),
      ...(valores.categoriaPadraoId ? { categoriaPadraoId: valores.categoriaPadraoId } : {}),
    };
    const operacao = this.dados.item
      ? this.api.atualizar(this.dados.item.id, requisicao)
      : this.api.criar(requisicao);
    this.enviando.set(true);
    operacao
      .pipe(
        finalize(() => this.enviando.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (item) => {
          this.mensagens.sucesso(
            this.translate.instant(
              this.dados.item
                ? 'CADASTROS.MENSAGENS.ATUALIZADO_COM_SUCESSO'
                : 'CADASTROS.MENSAGENS.CRIADO_COM_SUCESSO',
              { nome: item.nome },
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
  protected campoInvalido(nome: keyof ControlesFormularioItem): boolean {
    return this.enviado() && this.formulario.controls[nome].invalid;
  }
  private focarPrimeiroInvalido(): void {
    const nome = (Object.keys(this.formulario.controls) as (keyof ControlesFormularioItem)[]).find(
      (campo) => this.formulario.controls[campo].invalid,
    );
    if (nome) {
      this.foco.focarPorId(`item-${nome}`);
    }
  }
  private mensagemDeErro(erro: unknown): string {
    return erro instanceof HttpErrorResponse && typeof erro.error?.detail === 'string'
      ? erro.error.detail
      : this.translate.instant('CADASTROS.MENSAGENS.ERRO_SALVAR');
  }
}
