import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material/snack-bar';
import { TranslatePipe } from '@ngx-translate/core';

import { TipoMensagemGlobal } from './mensagem-global.service';

interface DadosMensagemGlobal {
  texto: string;
  tipo: TipoMensagemGlobal;
}

@Component({
  selector: 'app-mensagem-global',
  imports: [MatButtonModule, MatIconModule, TranslatePipe],
  templateUrl: './mensagem-global.html',
  styleUrl: './mensagem-global.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MensagemGlobalComponent {
  protected readonly dados = inject<DadosMensagemGlobal>(MAT_SNACK_BAR_DATA);
  private readonly snackBarRef = inject(MatSnackBarRef<MensagemGlobalComponent>);

  protected fechar(): void {
    this.snackBarRef.dismiss();
  }

  protected icone(): string {
    switch (this.dados.tipo) {
      case 'sucesso':
        return 'check_circle';
      case 'erro':
        return 'error';
      case 'aviso':
        return 'warning';
      case 'informacao':
        return 'info';
    }
  }
}
