import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

export interface ConfirmacaoDialogData {
  readonly titulo: string;
  readonly mensagem: string;
  readonly rotuloConfirmar: string;
  readonly rotuloCancelar: string;
  readonly tom?: 'padrao' | 'perigoso';
}

@Component({
  selector: 'app-confirmacao-dialog',
  imports: [MatButtonModule, MatDialogModule],
  templateUrl: './confirmacao-dialog.html',
  styleUrl: './confirmacao-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmacaoDialogComponent {
  protected readonly dados = inject<ConfirmacaoDialogData>(MAT_DIALOG_DATA);
  protected readonly dialogRef = inject(MatDialogRef<ConfirmacaoDialogComponent>);
}
