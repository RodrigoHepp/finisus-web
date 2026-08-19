import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { beforeEach, describe, expect, it } from 'vitest';

import { PaginacaoComponent } from './paginacao';

describe('PaginacaoComponent', () => {
  let fixture: ComponentFixture<PaginacaoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaginacaoComponent],
      providers: [provideTranslateService()],
    }).compileComponents();

    fixture = TestBed.createComponent(PaginacaoComponent);
    fixture.componentRef.setInput('pagina', 4);
    fixture.componentRef.setInput('totalPaginas', 10);
    fixture.componentRef.setInput('registrosExibidos', 20);
    fixture.componentRef.setInput('totalRegistros', 195);
    fixture.detectChanges();
  });

  it('exibe a página atual com duas opções de cada lado', () => {
    const paginas = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>(
        '.paginacao__pagina',
      ),
    );

    expect(paginas.map((pagina) => pagina.textContent?.trim())).toEqual(['3', '4', '5', '6', '7']);
    expect(paginas[2]?.classList.contains('paginacao__pagina--atual')).toBe(true);
    expect(paginas[2]?.getAttribute('aria-current')).toBe('page');
  });

  it('emite a página selecionada sem mudar a numeração para o contrato da API', () => {
    let paginaSolicitada: number | undefined;
    fixture.componentInstance.navegacaoSolicitada.subscribe(
      (pagina) => (paginaSolicitada = pagina),
    );

    const paginas = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>(
      '.paginacao__pagina',
    );
    paginas[3]?.click();

    expect(paginaSolicitada).toBe(5);
  });

  it('permite saltar diretamente para a última página', () => {
    let paginaSolicitada: number | undefined;
    fixture.componentInstance.navegacaoSolicitada.subscribe(
      (pagina) => (paginaSolicitada = pagina),
    );

    const botaoUltimaPagina = (
      fixture.nativeElement as HTMLElement
    ).querySelector<HTMLButtonElement>('.paginacao__ultima');
    botaoUltimaPagina?.click();

    expect(paginaSolicitada).toBe(9);
  });

  it('permanece visível quando a listagem possui apenas uma página', () => {
    fixture.componentRef.setInput('pagina', 0);
    fixture.componentRef.setInput('totalPaginas', 1);
    fixture.detectChanges();

    const paginacao = (fixture.nativeElement as HTMLElement).querySelector('.paginacao');
    const paginas = (fixture.nativeElement as HTMLElement).querySelectorAll('.paginacao__pagina');

    expect(paginacao).not.toBeNull();
    expect(paginas).toHaveLength(1);
    expect(paginas[0]?.textContent?.trim()).toBe('1');
  });
});
