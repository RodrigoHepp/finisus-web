import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-paginacao',
  imports: [MatButtonModule, MatIconModule, TranslatePipe],
  templateUrl: './paginacao.html',
  styleUrl: './paginacao.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginacaoComponent {
  readonly pagina = input.required<number>();
  readonly totalPaginas = input.required<number>();
  readonly registrosExibidos = input.required<number>();
  readonly totalRegistros = input.required<number>();
  readonly navegacaoSolicitada = output<number>();

  protected readonly paginasVisiveis = computed(() => {
    const paginaAtual = this.pagina();
    const totalPaginas = this.totalPaginas();
    const primeiraPagina = Math.max(0, Math.min(paginaAtual - 2, Math.max(0, totalPaginas - 5)));
    const ultimaPagina = Math.min(totalPaginas - 1, primeiraPagina + 4);

    return Array.from(
      { length: Math.max(0, ultimaPagina - primeiraPagina + 1) },
      (_, indice) => primeiraPagina + indice,
    );
  });

  protected navegarPara(pagina: number): void {
    if (pagina >= 0 && pagina < this.totalPaginas() && pagina !== this.pagina()) {
      this.navegacaoSolicitada.emit(pagina);
    }
  }
}
