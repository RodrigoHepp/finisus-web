import { computed, Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ProcessamentoGlobalService {
  private readonly quantidadeDeProcessamentos = signal(0);
  private readonly mensagemAtual = signal('COMPARTILHADO.PROCESSAMENTO.PADRAO');

  readonly estaProcessando = computed(() => this.quantidadeDeProcessamentos() > 0);
  readonly mensagem = computed(() => this.mensagemAtual());

  iniciar(mensagem: string): () => void {
    this.quantidadeDeProcessamentos.update((quantidade) => quantidade + 1);
    this.mensagemAtual.set(mensagem);

    let finalizado = false;

    return () => {
      if (finalizado) {
        return;
      }

      finalizado = true;
      this.quantidadeDeProcessamentos.update((quantidade) => Math.max(0, quantidade - 1));

      if (this.quantidadeDeProcessamentos() === 0) {
        this.mensagemAtual.set('COMPARTILHADO.PROCESSAMENTO.PADRAO');
      }
    };
  }
}
