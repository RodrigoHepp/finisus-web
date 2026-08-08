import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

export type ModoIndicadorProcessamento = 'inline' | 'sobreposto';

@Component({
  selector: 'app-indicador-processamento',
  imports: [MatProgressSpinnerModule],
  templateUrl: './indicador-processamento.html',
  styleUrl: './indicador-processamento.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IndicadorProcessamentoComponent {
  readonly mensagem = input('Processando...');
  readonly modo = input<ModoIndicadorProcessamento>('inline');
  readonly visivel = input(true);
}
