import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';
import { finalize } from 'rxjs';

import { PaginaResponse } from '../../../../core/api/paginacao.model';
import { MensagemGlobalService } from '../../../../core/feedback/mensagem-global.service';
import { IndicadorProcessamentoComponent } from '../../../../shared/ui/indicador-processamento/indicador-processamento';
import { PageHeaderComponent } from '../../../../shared/ui/page-header/page-header';
import { PaginacaoComponent } from '../../../../shared/ui/paginacao/paginacao';
import { RateioRecebido } from '../../compartilhamento.model';
import { CompartilhamentosApiService } from '../../compartilhamentos-api.service';

@Component({
  selector: 'app-compartilhamentos',
  imports: [
    CurrencyPipe,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatTableModule,
    IndicadorProcessamentoComponent,
    PageHeaderComponent,
    PaginacaoComponent,
  ],
  templateUrl: './compartilhamentos.page.html',
  styleUrl: './compartilhamentos.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompartilhamentosPage {
  private readonly api = inject(CompartilhamentosApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly mensagens = inject(MensagemGlobalService);

  protected readonly carregando = signal(true);
  protected readonly erro = signal<string | null>(null);
  protected readonly aceitaConvites = signal(false);
  protected readonly salvandoConsentimento = signal(false);
  protected readonly dados = signal<PaginaResponse<RateioRecebido>>({
    conteudo: [],
    pagina: 0,
    tamanho: 20,
    totalElementos: 0,
    totalPaginas: 0,
  });
  protected readonly colunas = ['origem', 'valor', 'situacao', 'acoes'];

  constructor() {
    this.carregar();
  }

  protected alterarConsentimento(aceita: boolean): void {
    this.salvandoConsentimento.set(true);
    this.api
      .atualizarOptIn(aceita)
      .pipe(
        finalize(() => this.salvandoConsentimento.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (configuracao) => {
          this.aceitaConvites.set(configuracao.aceita);
          this.mensagens.sucesso('Preferência de compartilhamento atualizada.');
        },
        error: () => this.mensagens.erro('Não foi possível atualizar sua preferência.'),
      });
  }

  protected responder(rateio: RateioRecebido, aceita: boolean): void {
    this.api
      .responderRateio(rateio.id, aceita)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.mensagens.sucesso(aceita ? 'Rateio aceito.' : 'Rateio recusado.');
          this.carregar(this.dados().pagina);
        },
        error: () => this.mensagens.erro('Não foi possível responder a este rateio.'),
      });
  }

  protected pagar(rateio: RateioRecebido): void {
    this.api
      .pagarRateio(rateio.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.mensagens.sucesso('Pagamento do rateio registrado.');
          this.carregar(this.dados().pagina);
        },
        error: () => this.mensagens.erro('Não foi possível registrar o pagamento.'),
      });
  }

  protected navegarParaPagina(pagina: number): void {
    this.carregar(pagina);
  }
  protected tentarNovamente(): void {
    this.carregar(this.dados().pagina);
  }

  private carregar(pagina = 0): void {
    this.carregando.set(true);
    this.erro.set(null);
    this.api
      .consultarOptIn()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (configuracao) => this.aceitaConvites.set(configuracao.aceita) });
    this.api
      .listarRateiosRecebidos({ pagina, tamanho: 20 })
      .pipe(
        finalize(() => this.carregando.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (dados) => this.dados.set(dados),
        error: () => this.erro.set('Não foi possível carregar os rateios recebidos.'),
      });
  }
}
