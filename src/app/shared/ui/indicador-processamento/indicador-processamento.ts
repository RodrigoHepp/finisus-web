import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslatePipe } from '@ngx-translate/core';

export type ModoIndicadorProcessamento = 'inline' | 'local' | 'sobreposto';

@Component({
  selector: 'app-indicador-processamento',
  imports: [MatProgressSpinnerModule, TranslatePipe],
  templateUrl: './indicador-processamento.html',
  styleUrl: './indicador-processamento.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IndicadorProcessamentoComponent {
  readonly mensagem = input<string>('COMPARTILHADO.PROCESSAMENTO.PADRAO');
  readonly modo = input<ModoIndicadorProcessamento>('inline');
  readonly visivel = input(true);
}
