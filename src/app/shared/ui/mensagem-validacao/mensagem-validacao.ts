import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { AbstractControl, ValidationErrors } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-mensagem-validacao',
  imports: [TranslatePipe],
  templateUrl: './mensagem-validacao.html',
  styleUrl: './mensagem-validacao.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MensagemValidacaoComponent {
  readonly controle = input.required<AbstractControl>();
  readonly chaveObrigatorio = input('CADASTROS.VALIDACOES.OBRIGATORIO');
  readonly chaveTamanhoMaximo = input('CADASTROS.VALIDACOES.TAMANHO_MAXIMO');
  readonly chavePadrao = input<string | null>(null);

  protected readonly erros = computed<ValidationErrors | null>(() => this.controle().errors);
}
