import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { TranslatePipe } from '@ngx-translate/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { TemaService } from '../../../core/tema/tema.service';

interface ItemNavegacao {
  rotulo: string;
  icone: string;
  rota: string;
}

@Component({
  selector: 'app-sidebar',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatListModule,
    RouterLink,
    RouterLinkActive,
    TranslatePipe,
  ],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  protected readonly temaService = inject(TemaService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly navegacaoSelecionada = output<void>();
  readonly recolhimentoAlternado = output<void>();

  readonly recolhida = input(false);
  readonly podeRecolher = input(false);

  protected readonly itensNavegacao: ItemNavegacao[] = [
    {
      rotulo: 'COMPARTILHADO.NAVEGACAO.VISAO_GERAL',
      icone: 'space_dashboard',
      rota: '/dashboard',
    },
    {
      rotulo: 'COMPARTILHADO.NAVEGACAO.CADASTRAR_USUARIO',
      icone: 'person_add',
      rota: '/usuarios/novo',
    },
  ];

  protected selecionarNavegacao(): void {
    this.navegacaoSelecionada.emit();
  }

  protected alternarRecolhimento(): void {
    if (this.podeRecolher()) {
      this.recolhimentoAlternado.emit();
    }
  }

  protected sair(): void {
    this.authService.encerrarSessao();
    this.navegacaoSelecionada.emit();

    void this.router.navigateByUrl('/login');
  }
}
