import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';

import { BreadcrumbsComponent } from './breadcrumbs';

describe('BreadcrumbsComponent', () => {
  let fixture: ComponentFixture<BreadcrumbsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BreadcrumbsComponent],
      providers: [
        provideRouter([
          { path: 'dashboard', component: BreadcrumbsComponent },
          { path: 'usuarios/novo', component: BreadcrumbsComponent },
        ]),
        provideTranslateService(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BreadcrumbsComponent);
  });

  it('exibe o caminho configurado para o cadastro de usuário', async () => {
    const router = TestBed.inject(Router);

    await router.navigateByUrl('/usuarios/novo');
    fixture.detectChanges();

    const itens = fixture.nativeElement.querySelectorAll('ol > li:not(.breadcrumbs-separator)');

    expect(itens).toHaveLength(3);
    expect(itens[0].textContent.trim()).toBe('COMPARTILHADO.NAVEGACAO.HOME');
    expect(itens[1].textContent.trim()).toBe('COMPARTILHADO.NAVEGACAO.ADMINISTRACAO');
    expect(itens[2].textContent.trim()).toBe('COMPARTILHADO.NAVEGACAO.CADASTRAR_USUARIO');
    expect(itens[2].querySelector('[aria-current="page"]')).not.toBeNull();
  });
});
