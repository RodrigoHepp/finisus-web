import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';

export type Tema = 'claro' | 'escuro';

const CHAVE_TEMA = 'finisus.theme';

@Injectable({ providedIn: 'root' })
export class TemaService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);

  readonly tema = signal<Tema>('claro');

  inicializar(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const temaSalvo = obterTemaValido(localStorage.getItem(CHAVE_TEMA));
    const sistemaPrefereEscuro =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;

    this.aplicar(temaSalvo ?? (sistemaPrefereEscuro ? 'escuro' : 'claro'), false);
  }

  alternar(): void {
    const proximoTema = this.tema() === 'claro' ? 'escuro' : 'claro';

    this.aplicar(proximoTema, true);
  }

  private aplicar(tema: Tema, salvarEscolha: boolean): void {
    this.tema.set(tema);

    this.document.documentElement.dataset['theme'] = tema === 'escuro' ? 'dark' : 'light';

    if (salvarEscolha) {
      localStorage.setItem(CHAVE_TEMA, tema);
    }
  }
}

function obterTemaValido(valor: string | null): Tema | null {
  return valor === 'claro' || valor === 'escuro' ? valor : null;
}
