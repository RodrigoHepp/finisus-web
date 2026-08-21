import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { finalize } from 'rxjs';

import { PaginaResponse } from '../../core/api/paginacao.model';
import { IndicadorProcessamentoComponent } from '../../shared/ui/indicador-processamento/indicador-processamento';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header';
import { PaginacaoComponent } from '../../shared/ui/paginacao/paginacao';
import { Fatura } from './fatura.model';
import { FaturasApiService } from './faturas-api.service';

@Component({
  selector: 'app-faturas',
  imports: [
    DatePipe,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    IndicadorProcessamentoComponent,
    PageHeaderComponent,
    PaginacaoComponent,
  ],
  templateUrl: './faturas.page.html',
  styleUrl: './faturas.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FaturasPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(FaturasApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cartaoId = Number(this.route.snapshot.paramMap.get('cartaoId'));

  protected readonly carregando = signal(true);
  protected readonly erro = signal<string | null>(null);
  protected readonly dados = signal<PaginaResponse<Fatura>>({
    conteudo: [],
    pagina: 0,
    tamanho: 20,
    totalElementos: 0,
    totalPaginas: 0,
  });
  protected readonly colunas = ['referencia', 'fechamento', 'vencimento', 'situacao'];

  constructor() {
    this.carregar();
  }

  protected voltar(): void {
    void this.router.navigate(['/cartoes']);
  }
  protected tentarNovamente(): void {
    this.carregar(this.dados().pagina);
  }
  protected navegarParaPagina(pagina: number): void {
    this.carregar(pagina);
  }

  private carregar(pagina = 0): void {
    this.carregando.set(true);
    this.erro.set(null);
    this.api
      .listarPorCartao(this.cartaoId, { pagina, tamanho: 20 })
      .pipe(
        finalize(() => this.carregando.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (dados) => this.dados.set(dados),
        error: () => this.erro.set('Não foi possível carregar as faturas deste cartão.'),
      });
  }
}
