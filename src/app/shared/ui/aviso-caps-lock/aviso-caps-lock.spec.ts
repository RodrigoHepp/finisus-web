import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';

import { AvisoCapsLockComponent } from './aviso-caps-lock';

describe('AvisoCapsLockComponent', () => {
  let component: AvisoCapsLockComponent;
  let fixture: ComponentFixture<AvisoCapsLockComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AvisoCapsLockComponent],
      providers: [provideTranslateService()],
    }).compileComponents();

    fixture = TestBed.createComponent(AvisoCapsLockComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('cria um aviso acessível para o Caps Lock ativo', () => {
    expect(component).toBeTruthy();

    const aviso = fixture.nativeElement.querySelector('.aviso-caps-lock') as HTMLElement | null;
    expect(aviso?.getAttribute('role')).toBe('status');
    expect(aviso?.querySelector('mat-icon')?.textContent?.trim()).toBe('keyboard_capslock');
  });
});
