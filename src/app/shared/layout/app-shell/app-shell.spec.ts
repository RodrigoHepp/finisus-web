import { BreakpointObserver } from '@angular/cdk/layout';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { AuthService } from '../../../core/auth/auth.service';
import { TemaService } from '../../../core/tema/tema.service';
import { AppShellComponent } from './app-shell';

interface AppShellParaTeste {
  sidebarRecolhida: () => boolean;
  alternarRecolhimentoDaSidebar(): void;
}

describe('AppShellComponent', () => {
  let component: AppShellComponent;
  let fixture: ComponentFixture<AppShellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppShellComponent],
      providers: [
        provideRouter([]),
        provideTranslateService(),
        {
          provide: BreakpointObserver,
          useValue: {
            observe: () => of({ matches: false, breakpoints: {} }),
          },
        },
        {
          provide: AuthService,
          useValue: {
            encerrarSessao: vi.fn(),
          },
        },
        {
          provide: TemaService,
          useValue: {
            tema: signal<'claro' | 'escuro'>('claro'),
            alternar: vi.fn(),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AppShellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('alterna o modo compacto da barra lateral no desktop', () => {
    const appShell = component as unknown as AppShellParaTeste;

    expect(appShell.sidebarRecolhida()).toBe(false);

    appShell.alternarRecolhimentoDaSidebar();
    fixture.detectChanges();

    expect(appShell.sidebarRecolhida()).toBe(true);
    const sidebar = fixture.nativeElement.querySelector('.app-sidebar') as HTMLElement;

    expect(sidebar.classList.contains('app-sidebar--recolhida')).toBe(true);
  });
});
