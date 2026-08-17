import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';

import { CampoFormularioComponent } from './campo-formulario';

describe('CampoFormularioComponent', () => {
  let fixture: ComponentFixture<CampoFormularioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CampoFormularioComponent],
      providers: [provideTranslateService()],
    }).compileComponents();

    fixture = TestBed.createComponent(CampoFormularioComponent);
    fixture.componentRef.setInput('rotulo', 'E-mail');
    fixture.componentRef.setInput('controleId', 'email');
  });

  it('traduz a indicação de obrigatoriedade', () => {
    fixture.componentRef.setInput('obrigatorio', true);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('COMPARTILHADO.CAMPOS.OBRIGATORIO');
  });
});
