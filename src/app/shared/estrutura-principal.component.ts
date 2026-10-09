import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { A11yModule } from '@angular/cdk/a11y';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { SessaoService } from '../infraestrutura/sessao/sessao.service';
import { PROVIDER_PAGINADOR_PT_BR } from './paginador-pt-br';
@Component({
  selector: 'fin-estrutura-principal',
  standalone: true,
  imports: [A11yModule, RouterOutlet, RouterLink, RouterLinkActive, MatButtonModule],
  providers: [PROVIDER_PAGINADOR_PT_BR],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <a class="atalho-conteudo" href="#conteudo">Ir para o conteúdo</a>
    <div class="layout-aplicacao">
      @if (menuMovelAberto()) {
        <button
          class="fundo-navegacao"
          aria-label="Fechar navegação"
          (click)="fecharMenu()"
        ></button>
      }
      <aside
        tabindex="-1"
        class="barra-lateral"
        [attr.inert]="telaMovel() && !menuMovelAberto() ? '' : null"
        [attr.aria-hidden]="telaMovel() && !menuMovelAberto() ? 'true' : null"
        [class.aberto]="menuMovelAberto()"
        [cdkTrapFocus]="menuMovelAberto()"
        [cdkTrapFocusAutoCapture]="menuMovelAberto()"
        (keydown.escape)="fecharMenu()"
      >
        <button mat-button class="alternar-menu" cdkFocusInitial (click)="fecharMenu()">
          Fechar menu</button
        ><a class="marca" routerLink="/visao-geral" aria-label="Finisus início"
          ><span class="simbolo-marca">f</span>finisus<span class="ponto-marca">.</span></a
        >
        <p class="slogan-marca">Clareza para suas escolhas.</p>
        <nav aria-label="Navegação principal">
          @for (item of navegacao(); track item.caminho) {
            <a
              [routerLink]="item.caminho"
              routerLinkActive="active"
              (click)="fecharMenu()"
              [attr.aria-label]="item.rotulo"
              ><span class="simbolo-navegacao" aria-hidden="true">{{ item.simbolo }}</span
              >{{ item.rotulo }}</a
            >
          }
        </nav>
        <div class="rodape-lateral">
          <p>Finanças com contexto</p>
          <button mat-button (click)="encerrarSessao()">Sair da sessão</button>
        </div>
      </aside>
      <div class="area-trabalho">
        <header class="barra-superior">
          <button
            mat-button
            #botaoMenu
            class="alternar-menu"
            (click)="menuMovelAberto.set(!menuMovelAberto())"
            [attr.aria-expanded]="menuMovelAberto()"
            aria-label="Abrir navegação"
          >
            ☰ Menu</button
          ><span class="rotulo-barra-superior">Seu espaço financeiro</span
          ><a routerLink="/perfil">Perfil e privacidade</a>
        </header>
        <main id="conteudo" tabindex="-1"><router-outlet /></main>
        <footer class="rodape-area-trabalho">
          Caixa, competência e compromissos têm significados distintos.
        </footer>
      </div>
    </div>`,
})
export class EstruturaPrincipalComponent {
  readonly menuMovelAberto = signal(false);
  readonly telaMovel = toSignal(
    inject(BreakpointObserver)
      .observe('(max-width: 760px)')
      .pipe(map((estado) => estado.matches)),
    { initialValue: false },
  );
  private readonly botaoMenu = viewChild<unknown, ElementRef<HTMLButtonElement>>('botaoMenu', {
    read: ElementRef,
  });
  private readonly sessao = inject(SessaoService);
  private readonly router = inject(Router);
  private readonly navegacaoFinanceira = [
    { caminho: '/visao-geral', rotulo: 'Visão geral', simbolo: '◉' },
    { caminho: '/movimentacoes', rotulo: 'Movimentações', simbolo: '↕' },
    { caminho: '/contas', rotulo: 'Contas e transferências', simbolo: '▣' },
    { caminho: '/cartoes', rotulo: 'Cartões e faturas', simbolo: '▤' },
    { caminho: '/compromissos', rotulo: 'Compromissos', simbolo: '◷' },
    { caminho: '/compartilhamentos', rotulo: 'Compartilhamentos', simbolo: '◎' },
    { caminho: '/investimentos', rotulo: 'Investimentos', simbolo: '↗' },
    { caminho: '/importacoes', rotulo: 'Importações', simbolo: '⇩' },
    { caminho: '/relatorios', rotulo: 'Relatórios e patrimônio', simbolo: '▥' },
    { caminho: '/cadastros', rotulo: 'Cadastros', simbolo: '◇' },
  ];
  readonly navegacao = computed(() =>
    this.sessao.temPermissao('USUARIO_CADASTRAR') || this.sessao.temPermissao('USUARIO_DESBLOQUEAR')
      ? [
          ...this.navegacaoFinanceira,
          { caminho: '/usuarios', rotulo: 'Usuários e acesso', simbolo: '♙' },
        ]
      : this.navegacaoFinanceira,
  );
  constructor() {
    effect(() => {
      if (!this.telaMovel()) this.menuMovelAberto.set(false);
    });
    effect(() => {
      if (!this.sessao.autenticado())
        void this.router.navigate(['/entrar'], { queryParams: { retorno: this.router.url } });
    });
  }
  fecharMenu() {
    if (!this.menuMovelAberto()) return;
    this.menuMovelAberto.set(false);
    this.botaoMenu()?.nativeElement.focus();
  }
  encerrarSessao() {
    if (!window.confirm('Deseja encerrar a sessão? Alterações não salvas serão descartadas.'))
      return;
    this.sessao.encerrarSessao();
    void this.router.navigate(['/entrar']);
  }
}
