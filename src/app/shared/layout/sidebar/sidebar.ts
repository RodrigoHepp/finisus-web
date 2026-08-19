import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter, map } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { TemaService } from '../../../core/tema/tema.service';
import {
  GRUPOS_NAVEGACAO,
  ITENS_NAVEGACAO_PRINCIPAL,
  GrupoNavegacao,
} from '../navigation/navigation.config';

@Component({
  selector: 'app-sidebar',
  imports: [MatIconModule, RouterLink, RouterLinkActive, TranslatePipe],
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

  protected readonly usuario = this.authService.usuario;
  protected readonly iniciaisDoUsuario = computed(() => {
    const nome = this.usuario()?.nome.trim() ?? '';
    const partesDoNome = nome.split(/\s+/).filter(Boolean);
    const partesParaIniciais =
      partesDoNome.length > 1
        ? [partesDoNome[0], partesDoNome[partesDoNome.length - 1]]
        : partesDoNome;

    return partesParaIniciais.map((parte) => parte.charAt(0).toLocaleUpperCase('pt-BR')).join('');
  });

  private readonly urlAtual = toSignal(
    this.router.events.pipe(
      filter((evento): evento is NavigationEnd => evento instanceof NavigationEnd),
      map((evento) => evento.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  private readonly gruposExpandidos = signal<ReadonlySet<string>>(new Set());

  protected readonly itensNavegacao = ITENS_NAVEGACAO_PRINCIPAL;
  protected readonly gruposNavegacao = GRUPOS_NAVEGACAO;

  protected selecionarNavegacao(): void {
    this.navegacaoSelecionada.emit();
  }

  protected alternarRecolhimento(): void {
    if (this.podeRecolher()) {
      this.recolhimentoAlternado.emit();
    }
  }

  protected grupoEstaExpandido(grupo: GrupoNavegacao): boolean {
    return (
      this.gruposExpandidos().has(grupo.id) ||
      grupo.itens.some((item) => this.urlAtual() === item.rota)
    );
  }

  protected alternarGrupo(id: string): void {
    if (this.recolhida() && this.podeRecolher()) {
      this.recolhimentoAlternado.emit();
    }

    this.gruposExpandidos.update((gruposAtuais) => {
      const gruposAtualizados = new Set(gruposAtuais);

      if (gruposAtualizados.has(id)) {
        gruposAtualizados.delete(id);
      } else {
        gruposAtualizados.add(id);
      }

      return gruposAtualizados;
    });
  }

  protected sair(): void {
    this.authService.encerrarSessao();
    this.navegacaoSelecionada.emit();

    void this.router.navigateByUrl('/login');
  }
}
