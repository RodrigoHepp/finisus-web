import { expect, test, Page } from '@playwright/test';

const conta = {
  id: 1,
  nome: 'Conta principal',
  tipo: 'CORRENTE',
  bancoId: null,
  saldo: 1000,
  ativo: true,
};
const destino = { ...conta, id: 2, nome: 'Reserva' };
const contaInativa = { ...conta, id: 3, nome: 'Conta encerrada', ativo: false };
async function configurarSessao(page: Page): Promise<void> {
  await page.addInitScript(() =>
    sessionStorage.setItem(
      'finisus.session',
      JSON.stringify({
        accessToken: 'mock-access',
        refreshToken: 'mock-refresh',
        expiraEm: '2099-01-01T00:00:00Z',
      }),
    ),
  );
}
async function confirmar(page: Page): Promise<void> {
  await page.getByRole('dialog').getByRole('button', { name: 'Confirmar', exact: true }).click();
}

test('transferência usa seleção paginada elegível, mantém chave após falha e estorna o agregado', async ({
  page,
}) => {
  await configurarSessao(page);
  const envios: { chave: string | undefined; corpo: unknown }[] = [];
  const requisicoes: string[] = [];
  let estornado = false;
  await page.route('**/api/v1/**', async (route) => {
    const requisicao = route.request(),
      url = new URL(requisicao.url());
    requisicoes.push(`${requisicao.method()} ${url.pathname}`);
    if (requisicao.method() === 'GET' && url.pathname.endsWith('/contas')) {
      const pagina = Number(url.searchParams.get('pagina') ?? 0);
      await route.fulfill({
        json: {
          conteudo: pagina === 0 ? [conta, contaInativa] : [destino],
          pagina,
          tamanho: 20,
          totalElementos: 21,
          totalPaginas: 2,
        },
      });
      return;
    }
    if (requisicao.method() === 'POST' && url.pathname.endsWith('/transferencias')) {
      envios.push({
        chave: requisicao.headers()['idempotency-key'],
        corpo: requisicao.postDataJSON(),
      });
      if (envios.length === 1) {
        await route.abort('failed');
        return;
      }
      await route.fulfill({
        status: 201,
        json: { id: 9, ...requisicao.postDataJSON(), status: 'ATIVA', estornadaEm: null },
      });
      return;
    }
    if (requisicao.method() === 'GET' && url.pathname.endsWith('/transferencias/9')) {
      await route.fulfill({
        json: {
          id: 9,
          contaOrigemId: 1,
          contaDestinoId: 2,
          valor: 125.5,
          data: '2026-10-07',
          descricao: 'Reserva de emergência',
          status: 'ATIVA',
          estornadaEm: null,
        },
      });
      return;
    }
    if (requisicao.method() === 'POST' && url.pathname.endsWith('/transferencias/9/estornar')) {
      estornado = true;
      await route.fulfill({
        json: {
          id: 9,
          contaOrigemId: 1,
          contaDestinoId: 2,
          valor: 125.5,
          data: '2026-10-07',
          descricao: 'Reserva de emergência',
          status: 'ESTORNADA',
          estornadaEm: '2026-10-07T14:00:00',
        },
      });
      return;
    }
    await route.fulfill({ status: 404, json: { detail: 'Requisição inesperada no teste.' } });
  });
  await page.goto('/contas');
  await expect(page.getByRole('heading', { name: 'Seu dinheiro em cada conta' })).toBeVisible();
  await page.getByRole('button', { name: 'Escolher conta de origem', exact: true }).click();
  const dialogoOrigem = page.getByRole('dialog');
  await expect(dialogoOrigem.getByRole('button', { name: /Conta encerrada/ })).toBeDisabled();
  await dialogoOrigem.getByRole('button', { name: 'Conta principal', exact: true }).click();
  await page.getByRole('button', { name: 'Escolher conta de destino', exact: true }).click();
  await page.getByRole('dialog').locator('.mat-mdc-paginator-navigation-next').click();
  await page.getByRole('dialog').getByRole('button', { name: 'Reserva', exact: true }).click();
  await page.getByLabel('Valor (R$)', { exact: true }).fill('125.50');
  await page.getByLabel('Data da transferência', { exact: true }).fill('2026-10-07');
  await page
    .getByLabel('Descrição da transferência', { exact: true })
    .fill('Reserva de emergência');
  await page.getByRole('button', { name: 'Confirmar transferência', exact: true }).click();
  await confirmar(page);
  await expect(page.getByRole('alert')).toContainText(
    /Não foi possível.*servidor|Não foi possível conectar/,
  );
  await expect(page.getByLabel('Valor (R$)', { exact: true })).toHaveValue('125.50');
  await page.getByRole('button', { name: 'Confirmar transferência', exact: true }).click();
  await confirmar(page);
  await expect(page.getByRole('heading', { name: 'Transferência #9', exact: true })).toBeVisible();
  expect(envios).toHaveLength(2);
  expect(envios[0].chave).toBeTruthy();
  expect(envios[1]).toEqual(envios[0]);
  expect(envios[1].corpo).toEqual({
    contaOrigemId: 1,
    contaDestinoId: 2,
    valor: 125.5,
    data: '2026-10-07',
    descricao: 'Reserva de emergência',
  });
  await page.getByLabel('Identificador da transferência', { exact: true }).fill('9');
  await page.getByRole('button', { name: 'Consultar', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Estornar transferência', exact: true }),
  ).toBeEnabled();
  await page.getByRole('button', { name: 'Estornar transferência', exact: true }).click();
  await confirmar(page);
  await expect(page.getByText('Reserva de emergência · Estornada', { exact: true })).toBeVisible();
  expect(estornado).toBe(true);
  expect(requisicoes).not.toContain('POST /api/v1/transacoes');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.locator('mat-error:visible')).toHaveCount(0);
  await page.evaluate(() => window.scrollTo(0, 0));
});

test('ajuste preserva zero informado e repete intenção sem calcular saldo no navegador', async ({
  page,
}) => {
  await configurarSessao(page);
  const envios: { chave: string | undefined; corpo: unknown }[] = [];
  await page.route('**/api/v1/**', async (route) => {
    const requisicao = route.request(),
      url = new URL(requisicao.url());
    if (requisicao.method() === 'GET' && url.pathname.endsWith('/contas')) {
      await route.fulfill({
        json: { conteudo: [conta], pagina: 0, tamanho: 20, totalElementos: 1, totalPaginas: 1 },
      });
      return;
    }
    if (requisicao.method() === 'GET' && url.pathname.endsWith('/contas/1')) {
      await route.fulfill({ json: conta });
      return;
    }
    if (requisicao.method() === 'GET' && url.pathname.endsWith('/contas/1/reconciliacao')) {
      await route.fulfill({
        json: {
          contaId: 1,
          saldoMaterializado: 1000,
          saldoCalculado: 990,
          divergencia: 10,
          quantidadeMovimentos: 3,
          quantidadeAjustes: 0,
          conciliado: false,
        },
      });
      return;
    }
    if (requisicao.method() === 'POST' && url.pathname.endsWith('/contas/1/ajustes-saldo')) {
      envios.push({
        chave: requisicao.headers()['idempotency-key'],
        corpo: requisicao.postDataJSON(),
      });
      if (envios.length === 1) {
        await route.abort('failed');
        return;
      }
      await route.fulfill({
        status: 201,
        json: {
          id: 5,
          contaId: 1,
          saldoAnterior: 1000,
          saldoCalculadoAnterior: 990,
          saldoInformado: 0,
          valorAjuste: -990,
          motivo: 'Saldo conferido no extrato',
          dataAjuste: '2026-10-07',
        },
      });
      return;
    }
    await route.fulfill({ status: 404, json: { detail: 'Requisição inesperada no teste.' } });
  });
  await page.goto('/contas');
  await page.getByRole('button', { name: 'Conferir conta', exact: true }).click();
  await page.getByRole('button', { name: 'Reconciliar saldo', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Divergência identificada' })).toBeVisible();
  await expect(page.getByText('990,00', { exact: false })).toBeVisible();
  await page.getByLabel('Saldo informado (R$)', { exact: true }).fill('0');
  await page.getByLabel('Motivo do ajuste', { exact: true }).fill('Saldo conferido no extrato');
  await page.getByRole('button', { name: 'Registrar ajuste', exact: true }).click();
  await confirmar(page);
  await expect(page.getByRole('alert')).toContainText(
    /Não foi possível.*servidor|Não foi possível conectar/,
  );
  await expect(page.getByLabel('Saldo informado (R$)', { exact: true })).toHaveValue('0');
  await page.getByRole('button', { name: 'Registrar ajuste', exact: true }).click();
  await confirmar(page);
  await expect(page.getByText('Operação concluída.', { exact: true })).toBeVisible();
  expect(envios).toHaveLength(2);
  expect(envios[0].chave).toBeTruthy();
  expect(envios[1]).toEqual(envios[0]);
  expect(envios[1].corpo).toEqual({ saldoInformado: 0, motivo: 'Saldo conferido no extrato' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.locator('mat-error:visible')).toHaveCount(0);
  await page.evaluate(() => window.scrollTo(0, 0));
});
