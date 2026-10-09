import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormControl, FormRecord, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Opcao, Campo, ValorCampo } from './formulario-compromisso';

/** Apresentação dos campos; não envia comandos nem possui o estado da intenção. */
@Component({
  selector: 'fin-campos-compromisso',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  templateUrl: './campos-compromisso.component.html',
  styles: `
    :host {
      display: block;
    }
    .grade-formulario {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr));
      gap: 18px;
    }
    @media (max-width: 600px) {
      .grade-formulario {
        grid-template-columns: 1fr;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CamposCompromissoComponent {
  readonly formulario = input.required<FormRecord<FormControl<ValorCampo>>>();
  readonly campos = input.required<Campo[]>();
  readonly opcoes = input.required<(campo: Campo) => Opcao[]>();
  campoInteiro(chave: string): boolean {
    return [
      'numeroParcelas',
      'diaFechamento',
      'diaVencimento',
      'diaDoMes',
      'numeroParcelasRestantes',
      'parcelaId',
    ].includes(chave);
  }
}
