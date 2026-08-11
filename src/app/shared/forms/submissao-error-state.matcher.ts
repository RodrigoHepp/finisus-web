import { ErrorStateMatcher } from '@angular/material/core';
import { AbstractControl, FormGroupDirective, NgForm } from '@angular/forms';

/** Exibe o estado visual de erro somente depois de uma tentativa de submissão. */
export class SubmissaoErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: AbstractControl | null, form: FormGroupDirective | NgForm | null): boolean {
    return Boolean(control?.invalid && form?.submitted);
  }
}
