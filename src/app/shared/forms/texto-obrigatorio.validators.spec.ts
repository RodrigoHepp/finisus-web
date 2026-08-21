import { FormControl, Validators } from '@angular/forms';

import { validarTextoObrigatorio } from './texto-obrigatorio.validators';

describe('validarTextoObrigatorio', () => {
  it('rejeita valores vazios ou compostos somente por espaços', () => {
    const controle = new FormControl('   ', {
      nonNullable: true,
      validators: [Validators.required, validarTextoObrigatorio()],
    });

    expect(controle.hasError('required')).toBe(true);

    controle.setValue(' Banco principal ');

    expect(controle.errors).toBeNull();
  });
});
