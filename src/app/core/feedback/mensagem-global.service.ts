import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

import { MensagemGlobalComponent } from '../../shared/ui/mensagem-global/mensagem-global';

export type TipoMensagemGlobal = 'sucesso' | 'erro' | 'aviso' | 'informacao';

interface DadosMensagemGlobal {
  readonly texto: string;
  readonly tipo: TipoMensagemGlobal;
}

@Injectable({ providedIn: 'root' })
export class MensagemGlobalService {
  private readonly snackBar = inject(MatSnackBar);

  sucesso(texto: string): void {
    this.exibir({ texto, tipo: 'sucesso' });
  }

  erro(texto: string): void {
    this.exibir({ texto, tipo: 'erro' });
  }

  aviso(texto: string): void {
    this.exibir({ texto, tipo: 'aviso' });
  }

  informacao(texto: string): void {
    this.exibir({ texto, tipo: 'informacao' });
  }

  private exibir(dados: DadosMensagemGlobal): void {
    this.snackBar.openFromComponent(MensagemGlobalComponent, {
      data: dados,
      duration: dados.tipo === 'erro' ? 7000 : 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['finisus-mensagem-global'],
      politeness: dados.tipo === 'erro' ? 'assertive' : 'polite',
      announcementMessage: dados.texto,
    });
  }
}
