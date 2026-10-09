import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

interface LinhaSnapshot {
  rotulo: string;
  valor: string;
}
const rotulos: Record<string, string> = {
  tipo: 'Tipo',
  valor: 'Valor',
  data: 'Data',
  descricao: 'Descrição',
  contaId: 'Conta',
  categoriaId: 'Categoria',
  meioPagamentoId: 'Meio de pagamento',
  itemId: 'Item do catálogo',
  quantidade: 'Quantidade',
};
function linhasPara(valor: unknown, prefixo = ''): LinhaSnapshot[] {
  if (typeof valor !== 'object' || valor === null || Array.isArray(valor)) return [];
  const linhas: LinhaSnapshot[] = [];
  for (const [chave, valorOriginal] of Object.entries(valor)) {
    if (chave === 'itens' && Array.isArray(valorOriginal)) {
      valorOriginal.forEach((item: unknown, indice: number) =>
        linhas.push(...linhasPara(item, `Item ${indice + 1} · `)),
      );
      continue;
    }
    if (!(chave in rotulos)) continue;
    let formatado =
      valorOriginal === null
        ? 'Não informado'
        : typeof valorOriginal === 'string' || typeof valorOriginal === 'number'
          ? String(valorOriginal)
          : 'Não disponível';
    if (chave === 'tipo')
      formatado =
        valorOriginal === 'ENTRADA'
          ? 'Entrada'
          : valorOriginal === 'SAIDA'
            ? 'Saída'
            : 'Tipo não reconhecido';
    if (
      chave === 'data' &&
      typeof valorOriginal === 'string' &&
      /^\d{4}-\d{2}-\d{2}$/.test(valorOriginal)
    )
      formatado = `${valorOriginal.slice(8, 10)}/${valorOriginal.slice(5, 7)}/${valorOriginal.slice(0, 4)}`;
    if (
      chave === 'valor' &&
      (typeof valorOriginal === 'string' || typeof valorOriginal === 'number') &&
      Number.isFinite(Number(valorOriginal))
    )
      formatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
        Number(valorOriginal),
      );
    if (chave.endsWith('Id') && typeof valorOriginal === 'number') formatado = `#${valorOriginal}`;
    linhas.push({ rotulo: `${prefixo}${rotulos[chave]}`, valor: formatado });
  }
  return linhas;
}
@Component({
  selector: 'fin-transacao-snapshot',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@if (linhas().length) {
      <dl>
        @for (linha of linhas(); track $index) {
          <dt>{{ linha.rotulo }}</dt>
          <dd>{{ linha.valor }}</dd>
        }
      </dl>
    } @else {
      <p>Registro integral não disponível.</p>
    }`,
  styles: `
    dl {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.5rem;
    }
    dd {
      margin: 0;
      overflow-wrap: anywhere;
    }
    @media (max-width: 600px) {
      dl {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class TransacaoSnapshotComponent {
  readonly snapshot = input<string | null>(null);
  readonly linhas = computed(() => {
    const snapshot = this.snapshot();
    if (!snapshot) return [];
    try {
      const interpretado: unknown = JSON.parse(snapshot);
      return linhasPara(interpretado);
    } catch {
      return [];
    }
  });
}
