import { throwError } from 'rxjs';
import { vi } from 'vitest';

import { carregarIdiomaInicial } from './app.config';

describe('carregarIdiomaInicial', () => {
  it('permite a inicialização da aplicação quando o arquivo de tradução falha', async () => {
    const translateService = {
      use: vi.fn(() => throwError(() => new Error('Arquivo de tradução indisponível'))),
    };

    await expect(carregarIdiomaInicial(translateService)).resolves.toBeUndefined();
    expect(translateService.use).toHaveBeenCalledWith('pt-BR');
  });
});
