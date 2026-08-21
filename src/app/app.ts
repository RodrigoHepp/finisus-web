import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { ProcessamentoGlobalService } from './core/processamento/processamento-global.service';
import { TemaService } from './core/tema/tema.service';
import { IndicadorProcessamentoComponent } from './shared/ui/indicador-processamento/indicador-processamento';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, IndicadorProcessamentoComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly temaService = inject(TemaService);
  protected readonly processamentoGlobalService = inject(ProcessamentoGlobalService);

  constructor() {
    this.temaService.inicializar();
  }
}
