import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-cabecalho-dialogo-formulario',
  imports: [MatButtonModule, MatDialogModule, MatIconModule, TranslatePipe],
  templateUrl: './cabecalho-dialogo-formulario.html',
  styleUrl: './cabecalho-dialogo-formulario.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CabecalhoDialogoFormularioComponent {
  readonly titulo = input.required<string>();
  readonly descricao = input.required<string>();
  readonly enviando = input(false);
  readonly fechar = output<void>();
}
