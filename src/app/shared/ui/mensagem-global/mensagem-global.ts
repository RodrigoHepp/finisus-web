import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material/snack-bar';
import { TranslatePipe } from '@ngx-translate/core';

import { TipoMensagemGlobal } from '../../../core/feedback/mensagem-global.service';

interface DadosMensagemGlobal {
  texto: string;
  tipo: TipoMensagemGlobal;
}

const ICONE_POR_TIPO: Readonly<Record<TipoMensagemGlobal, string>> = {
  sucesso: 'check_circle',
  erro: 'error',
  aviso: 'warning',
  informacao: 'info',
};

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
  protected readonly icone = ICONE_POR_TIPO[this.dados.tipo];

  protected fechar(): void {
    this.snackBarRef.dismiss();
  }
}
