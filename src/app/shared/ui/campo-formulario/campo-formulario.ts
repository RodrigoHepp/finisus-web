import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-campo-formulario',
  imports: [TranslatePipe],
  templateUrl: './campo-formulario.html',
  styleUrl: './campo-formulario.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampoFormularioComponent {
  readonly rotulo = input.required<string>();
  readonly controleId = input.required<string>();
  readonly obrigatorio = input(false);
}
