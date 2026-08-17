import { FormControl, FormGroupDirective, Validators } from '@angular/forms';

import { SubmissaoErrorStateMatcher } from './submissao-error-state.matcher';

describe('SubmissaoErrorStateMatcher', () => {
  const matcher = new SubmissaoErrorStateMatcher();

  it('não apresenta erro para um campo inválido apenas tocado', () => {
    const control = new FormControl('', { validators: Validators.required });
    const form = { submitted: false } as FormGroupDirective;

    control.markAsTouched();

    expect(matcher.isErrorState(control, form)).toBe(false);
  });

  it('apresenta erro para um campo inválido após a submissão', () => {
    const control = new FormControl('', { validators: Validators.required });
    const form = { submitted: true } as FormGroupDirective;

    expect(matcher.isErrorState(control, form)).toBe(true);
  });
});
