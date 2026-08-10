import { BreakpointObserver } from '@angular/cdk/layout';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { TranslatePipe } from '@ngx-translate/core';
import { RouterOutlet } from '@angular/router';

import { SidebarComponent } from '../sidebar/sidebar';

@Component({
  selector: 'app-app-shell',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatSidenavModule,
    MatToolbarModule,
    RouterOutlet,
    SidebarComponent,
    TranslatePipe,
  ],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShellComponent {
  private readonly breakpointCelular = '(max-width: 767px)';
  private readonly breakpointObserver = inject(BreakpointObserver);

  private readonly estadoTela = toSignal(this.breakpointObserver.observe(this.breakpointCelular), {
    initialValue: {
      matches: false,
      breakpoints: {},
    },
  });

  protected readonly menuAberto = signal(false);
  protected readonly sidebarRecolhida = signal(false);

  protected readonly ehCelular = computed(() => this.estadoTela().matches);

  protected readonly sidebarEstaRecolhida = computed(
    () => !this.ehCelular() && this.sidebarRecolhida(),
  );

  protected readonly modoSidebar = computed<'over' | 'side'>(() =>
    this.ehCelular() ? 'over' : 'side',
  );

  protected readonly sidebarAberta = computed(() => (this.ehCelular() ? this.menuAberto() : true));

  protected alternarMenu(): void {
    this.menuAberto.update((aberto) => !aberto);
  }

  protected fecharMenu(): void {
    this.menuAberto.set(false);
  }

  protected alternarRecolhimentoDaSidebar(): void {
    if (!this.ehCelular()) {
      this.sidebarRecolhida.update((recolhida) => !recolhida);
    }
  }
}
