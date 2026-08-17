import { TestBed } from '@angular/core/testing';

import { TemaService } from './tema.service';

describe('TemaService', () => {
  let service: TemaService;

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    TestBed.configureTestingModule({});
    service = TestBed.inject(TemaService);
  });

  it('deve ser criado', () => {
    expect(service).toBeTruthy();
  });

  it('ignora o tema persistido que não pertence às opções suportadas', () => {
    localStorage.setItem('finisus.theme', 'tema-invalido');

    service.inicializar();

    expect(service.tema()).toBe('claro');
    expect(document.documentElement.dataset['theme']).toBe('light');
  });
});
