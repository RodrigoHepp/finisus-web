import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ReactiveFormsModule } from '@angular/forms';
import { Observable, finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { mensagemErro } from './apresentacao';

export const IMPORTS_JORNADA = [
  MatDialogModule,
  MatButtonModule,
  MatFormFieldModule,
  MatInputModule,
  MatSelectModule,
  MatPaginatorModule,
  MatCheckboxModule,
  ReactiveFormsModule,
];

@Component({
  selector: 'fin-confirmacaoacao-jornada',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<h2 mat-dialog-title>Confirmar operação</h2>
    <mat-dialog-content>{{ texto }}</mat-dialog-content
    ><mat-dialog-actions align="end"
      ><button mat-button [mat-dialog-close]="false">Voltar</button
      ><button mat-flat-button [mat-dialog-close]="true">Confirmar</button></mat-dialog-actions
    >`,
})
export class ConfirmacaoJornadaComponent {
  readonly texto = inject<string>(MAT_DIALOG_DATA);
}

export abstract class EstadoJornada {
  protected readonly destroyRef = inject(DestroyRef);
  private readonly dialog = inject(MatDialog);
  private readonly requisicoesPendentes = signal(0);
  readonly ocupado = computed(() => this.requisicoesPendentes() > 0);
  readonly salvando = signal(false);
  readonly erro = signal('');
  readonly sucesso = signal('');
  protected executar<T>(
    operacao: Observable<T>,
    aoConcluir: (valor: T) => void,
    mutacao = false,
  ): void {
    if (mutacao && this.salvando()) return;
    this.requisicoesPendentes.update((valor) => valor + 1);
    if (mutacao) this.salvando.set(true);
    this.erro.set('');
    if (mutacao) this.sucesso.set('');
    operacao
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.requisicoesPendentes.update((valor) => valor - 1);
          if (mutacao) this.salvando.set(false);
        }),
      )
      .subscribe({
        next: (valor) => {
          aoConcluir(valor);
          if (mutacao) this.sucesso.set('Operação concluída.');
        },
        error: (erro: unknown) => this.erro.set(mensagemErro(erro)),
      });
  }
  protected confirmar(texto: string, acao: () => void): void {
    if (this.salvando()) return;
    this.dialog
      .open(ConfirmacaoJornadaComponent, { data: texto, width: '460px', restoreFocus: true })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((aceito) => {
        if (aceito === true) acao();
      });
  }
}
