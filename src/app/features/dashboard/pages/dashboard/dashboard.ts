import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { PageHeaderComponent } from '../../../../shared/ui/page-header/page-header';

@Component({
  selector: 'app-dashboard',
  imports: [MatButtonModule, MatIconModule, PageHeaderComponent, RouterLink, TranslatePipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPage {
  protected readonly primeirosPassos = [
    {
      rota: '/cadastros/bancos',
      icone: 'account_balance',
      titulo: 'DASHBOARD.PRIMEIROS_PASSOS.BANCOS.TITULO',
      descricao: 'DASHBOARD.PRIMEIROS_PASSOS.BANCOS.DESCRICAO',
      acao: 'DASHBOARD.PRIMEIROS_PASSOS.BANCOS.ACAO',
    },
    {
      rota: '/cadastros/contas',
      icone: 'account_balance_wallet',
      titulo: 'DASHBOARD.PRIMEIROS_PASSOS.CONTAS.TITULO',
      descricao: 'DASHBOARD.PRIMEIROS_PASSOS.CONTAS.DESCRICAO',
      acao: 'DASHBOARD.PRIMEIROS_PASSOS.CONTAS.ACAO',
    },
    {
      rota: '/cadastros/categorias',
      icone: 'category',
      titulo: 'DASHBOARD.PRIMEIROS_PASSOS.CATEGORIAS.TITULO',
      descricao: 'DASHBOARD.PRIMEIROS_PASSOS.CATEGORIAS.DESCRICAO',
      acao: 'DASHBOARD.PRIMEIROS_PASSOS.CATEGORIAS.ACAO',
    },
  ] as const;
}
