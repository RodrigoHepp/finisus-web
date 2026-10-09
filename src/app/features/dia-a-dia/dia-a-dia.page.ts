import { ChangeDetectionStrategy, Component, inject, viewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CadastrosPage } from './cadastros.page';
import { ContasPage } from './contas.page';
import { TransacoesPage } from './transacoes.page';

@Component({
  selector: 'fin-dia-a-dia-page',
  standalone: true,
  imports: [CadastrosPage, ContasPage, TransacoesPage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@switch (jornada) {
    @case ('cadastros') {
      <fin-cadastros-page />
    }
    @case ('contas') {
      <fin-contas-page />
    }
    @default {
      <fin-transacoes-page />
    }
  }`,
})
export class DiaADiaPage {
  readonly jornada = inject(ActivatedRoute).snapshot.data['jornada'] as string;
  private readonly cadastros = viewChild(CadastrosPage);
  private readonly contas = viewChild(ContasPage);
  private readonly transacoes = viewChild(TransacoesPage);
  temAlteracoes(): boolean {
    return (
      this.cadastros()?.temAlteracoes() === true ||
      this.contas()?.temAlteracoes() === true ||
      this.transacoes()?.temAlteracoes() === true
    );
  }
}
