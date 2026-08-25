import { expect, Page, test } from '@playwright/test';

async function prepararApi(page: Page): Promise<void> {
  await page.route('**/api/v1/**', async (route) => {
    const url = new URL(route.request().url());
    const responder = (body: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

    if (url.pathname.endsWith('/auth/login')) {
      return responder({
        accessToken: 'teste',
        refreshToken: 'teste',
        expiraEm: '2030-01-01T00:00:00Z',
      });
    }
    if (url.pathname.endsWith('/usuarios/me')) {
      return responder({ id: 1, nome: 'Ana Silva', email: 'ana@finisus.test', ativo: true });
    }
    if (
      url.pathname.endsWith('/contas') ||
      url.pathname.endsWith('/categorias') ||
      url.pathname.endsWith('/meios-pagamento')
    ) {
      return responder({
        conteudo: [{ id: 1, nome: 'Conta de teste' }],
        pagina: 0,
        tamanho: 20,
        totalElementos: 1,
        totalPaginas: 1,
      });
    }
    if (
      url.pathname.endsWith('/recorrencias') ||
      url.pathname.endsWith('/transacoes') ||
      url.pathname.endsWith('/compras-parceladas') ||
      url.pathname.endsWith('/investimentos') ||
      url.pathname.endsWith('/financiamentos')
    ) {
      return responder({
        conteudo: [],
        pagina: 0,
        tamanho: 20,
        totalElementos: 0,
        totalPaginas: 0,
      });
    }
    return responder({});
  });
}

test('conclui login, cadastro, transação e jornada financeira com API simulada', async ({
  page,
}) => {
  await prepararApi(page);
  await page.goto('/login');

  await page.getByRole('textbox', { name: /E-mail/ }).fill('ana@finisus.test');
  await page.getByLabel(/Senha/).fill('segredo');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.goto('/usuarios/novo');
  await page.locator('#cadastro-nome').fill('Bruno Costa');
  await page.locator('#cadastro-email').fill('bruno@finisus.test');
  await page.locator('#cadastro-senha').fill('SenhaSegura123');
  await page.locator('#cadastro-confirmacao-senha').fill('SenhaSegura123');
  const cadastroSolicitado = page.waitForRequest(
    (request) => request.method() === 'POST' && request.url().endsWith('/api/v1/usuarios'),
  );
  await page.getByRole('button', { name: 'Salvar' }).click();
  await cadastroSolicitado;

  await page.goto('/transacoes');
  await page.getByRole('button', { name: 'Nova transação' }).first().click();
  await page.locator('#transacao-valor').fill('80,00');
  await page.locator('#transacao-data').fill('2026-08-24');
  await page.locator('#transacao-contaId').click();
  await page.getByRole('option', { name: 'Conta de teste' }).click();
  await page.locator('#transacao-descricao').fill('Mercado');
  const transacaoSolicitada = page.waitForRequest(
    (request) => request.method() === 'POST' && request.url().endsWith('/api/v1/transacoes'),
  );
  await page.getByRole('button', { name: 'Salvar' }).click();
  await transacaoSolicitada;

  for (const caminho of [
    '/recorrencias',
    '/compras-parceladas',
    '/investimentos',
    '/financiamentos',
  ]) {
    await page.goto(caminho);
    await expect(page.getByRole('main')).toBeVisible();
  }

  await page.goto('/recorrencias');
  await page.getByRole('button', { name: 'Nova recorrência' }).first().click();
  await page.locator('#recorrencia-nome').fill('Internet');
  await page.locator('#recorrencia-valorEsperado').fill('120,00');
  await page.locator('#recorrencia-contaId').click();
  await page.getByRole('option', { name: 'Conta de teste' }).click();
  await page.getByRole('button', { name: 'Salvar' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
