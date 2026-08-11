import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { vi } from 'vitest';

import { AuthService } from '../../../core/auth/auth.service';
import { TemaService } from '../../../core/tema/tema.service';
import { SidebarComponent } from './sidebar';

describe('SidebarComponent', () => {
  let fixture: ComponentFixture<SidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [
        provideRouter([]),
        provideTranslateService(),
        {
          provide: AuthService,
          useValue: {
            encerrarSessao: vi.fn(),
            usuario: signal({
              id: 1,
              nome: 'Usuário de teste',
              email: 'usuario@finisus.com',
              ativo: true,
            }),
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

    fixture = TestBed.createComponent(SidebarComponent);
    fixture.detectChanges();
  });

  it('exibe o cadastro de usuário somente após expandir o grupo de usuários', () => {
    const botaoGrupo = fixture.nativeElement.querySelector(
      '.nav-group-button',
    ) as HTMLButtonElement;

    expect(botaoGrupo.classList.contains('mat-mdc-list-item')).toBe(false);
    expect(botaoGrupo.getAttribute('aria-expanded')).toBe('false');
    expect(botaoGrupo.getAttribute('aria-controls')).toBeNull();
    expect(botaoGrupo.querySelector('.nav-group-indicator')).not.toBeNull();
    expect(botaoGrupo.querySelector('.nav-group-indicator--expandido')).toBeNull();
    expect(fixture.nativeElement.querySelector('.nav-submenu')).toBeNull();

    botaoGrupo.click();
    fixture.detectChanges();

    expect(botaoGrupo.getAttribute('aria-expanded')).toBe('true');
    expect(botaoGrupo.getAttribute('aria-controls')).toBe('submenu-usuarios');
    expect(botaoGrupo.querySelector('.nav-group-indicator--expandido')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.nav-submenu-item')).not.toBeNull();
  });

  it('mantém os ícones de navegação visíveis quando a barra está recolhida', () => {
    fixture.componentRef.setInput('recolhida', true);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.sidebar-navigation')).not.toBeNull();
    expect(
      fixture.nativeElement.querySelector('.sidebar-navigation-item mat-icon')?.textContent?.trim(),
    ).toBe('home');
    expect(fixture.nativeElement.querySelector('.sidebar-action')).not.toBeNull();
  });

  it('exibe a marca e os dados do usuário somente na barra expandida', () => {
    expect(fixture.nativeElement.querySelector('.sidebar-user-mark')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.sidebar-user-email')).not.toBeNull();

    fixture.componentRef.setInput('recolhida', true);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.sidebar-user')).toBeNull();
  });
});
