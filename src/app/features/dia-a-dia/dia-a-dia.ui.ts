import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { mensagemErro } from '../../shared/apresentacao';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule } from '@angular/material/paginator';
import { ReactiveFormsModule } from '@angular/forms';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Observable, Subscription, finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export const IMPORTS_DIA_A_DIA = [
  MatButtonModule,
  MatDialogModule,
  MatFormFieldModule,
  MatInputModule,
  MatSelectModule,
  MatPaginatorModule,
  ReactiveFormsModule,
  CurrencyPipe,
  DatePipe,
];
export function erroDiaADia(erro: unknown): string {
  return mensagemErro(erro);
}
@Component({
  selector: 'fin-confirmacao',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<h2 mat-dialog-title>Confirmar operação</h2>
    <mat-dialog-content>{{ texto }}</mat-dialog-content
    ><mat-dialog-actions align="end"
      ><button mat-button [mat-dialog-close]="false">Cancelar</button
      ><button mat-flat-button [mat-dialog-close]="true">Confirmar</button></mat-dialog-actions
    >`,
})
export class ConfirmacaoDiaADiaComponent {
  readonly texto = inject<string>(MAT_DIALOG_DATA);
}

export abstract class EstadoDiaADia {
  protected readonly destroyRef = inject(DestroyRef);
  private readonly dialog = inject(MatDialog);
  readonly ocupado = signal(false);
  readonly salvando = signal(false);
  readonly erro = signal('');
  readonly sucesso = signal('');
  private subscriptionConsulta: Subscription | null = null;
  protected executar<T>(
    operacao: Observable<T>,
    aoConcluir: (valor: T) => void,
    mutacao = false,
  ): void {
    if (mutacao && (this.ocupado() || this.salvando())) return;
    if (mutacao) this.salvando.set(true);
    if (!mutacao) this.subscriptionConsulta?.unsubscribe();
    this.ocupado.set(true);
    this.erro.set('');
    this.sucesso.set('');
    let entregue = false;
    const subscription = operacao
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          if (!entregue) this.ocupado.set(false);
          if (mutacao) this.salvando.set(false);
        }),
      )
      .subscribe({
        next: (valor) => {
          entregue = true;
          this.ocupado.set(false);
          aoConcluir(valor);
          if (mutacao) this.sucesso.set('Operação concluída.');
        },
        error: (erro: unknown) => this.erro.set(erroDiaADia(erro)),
      });
    if (!mutacao) this.subscriptionConsulta = subscription;
  }
  protected confirmar(texto: string, acao: () => void): void {
    this.dialog
      .open(ConfirmacaoDiaADiaComponent, { data: texto, width: '440px', restoreFocus: true })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((aceito) => {
        if (aceito === true) acao();
      });
  }
}
