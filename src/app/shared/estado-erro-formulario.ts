import { ErrorStateMatcher } from '@angular/material/core';
import { FormControl } from '@angular/forms';
import { Injectable } from '@angular/core';
/** O envio marca os controles como tocados; o reset limpa essa intenção para a próxima operação. */
@Injectable()
export class EstadoErroFormulario extends ErrorStateMatcher {
  override isErrorState(controle: FormControl | null): boolean {
    return !!controle?.invalid && controle.touched;
  }
}
