import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { finalize } from 'rxjs';

import { PaginaResponse } from '../../../../core/api/paginacao.model';
import { MensagemGlobalService } from '../../../../core/feedback/mensagem-global.service';
import { IndicadorProcessamentoComponent } from '../../../../shared/ui/indicador-processamento/indicador-processamento';
import { PageHeaderComponent } from '../../../../shared/ui/page-header/page-header';
import { PaginacaoComponent } from '../../../../shared/ui/paginacao/paginacao';
import { PrevisaoMensal } from '../../previsao.model';
import { PrevisoesApiService } from '../../previsoes-api.service';

const mesAtual = new Date()
  .toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' })
  .slice(0, 7);

@Component({
  selector: 'app-previsoes',
  imports: [
    CurrencyPipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatTableModule,
    IndicadorProcessamentoComponent,
    PageHeaderComponent,
    PaginacaoComponent,
  ],
  templateUrl: './previsoes.page.html',
  styleUrl: './previsoes.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrevisoesPage {
  private readonly api = inject(PrevisoesApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly mensagens = inject(MensagemGlobalService);

  protected readonly mes = new FormControl(mesAtual, { nonNullable: true });
  protected readonly carregando = signal(true);
  protected readonly erro = signal<string | null>(null);
  protected readonly dados = signal<PaginaResponse<PrevisaoMensal>>({
    conteudo: [],
    pagina: 0,
    tamanho: 20,
    totalElementos: 0,
    totalPaginas: 0,
  });
  protected readonly colunas = ['categoria', 'entrada', 'saida', 'saldo'];

  constructor() {
    this.carregar();
  }

  protected atualizarConsulta(): void {
    this.carregar();
  }

  protected recalcular(): void {
    this.api
      .recalcular(3)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.mensagens.sucesso('Previsões recalculadas para os próximos meses.');
          this.carregar();
        },
        error: () => this.mensagens.erro('Não foi possível recalcular as previsões.'),
      });
  }

  protected navegarParaPagina(pagina: number): void {
    this.carregar(pagina);
  }

  private carregar(pagina = 0): void {
    this.carregando.set(true);
    this.erro.set(null);
    this.api
      .consultar(this.mes.value, { pagina, tamanho: 20 })
      .pipe(
        finalize(() => this.carregando.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (dados) => this.dados.set(dados),
        error: () => this.erro.set('Não foi possível carregar as previsões deste mês.'),
      });
  }
}
