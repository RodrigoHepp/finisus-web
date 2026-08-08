import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { vi } from 'vitest';

import { MensagemGlobalComponent } from './mensagem-global';
import { MensagemGlobalService } from './mensagem-global.service';

describe('MensagemGlobalService', () => {
  it('configura uma mensagem de erro com anúncio assertivo e duração maior', () => {
    const snackBar = { openFromComponent: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        {
          provide: MatSnackBar,
          useValue: snackBar,
        },
      ],
    });

    const service = TestBed.inject(MensagemGlobalService);
    service.erro('Não foi possível concluir a operação.');

    expect(snackBar.openFromComponent).toHaveBeenCalledWith(MensagemGlobalComponent, {
      data: {
        texto: 'Não foi possível concluir a operação.',
        tipo: 'erro',
      },
      duration: 7000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['finisus-mensagem-global'],
      politeness: 'assertive',
      announcementMessage: 'Não foi possível concluir a operação.',
    });
  });
});
