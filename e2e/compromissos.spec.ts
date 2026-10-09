import { expect, Page, Route, test } from '@playwright/test';
import type {
  Cartao,
  Financiamento,
  Parcela,
  DetalheFatura,
  Ocorrencia,
} from '../src/app/features/compromissos/compromissos.api';

const cartao: Cartao = {
  id: 4,
  nome: 'Cartão de teste',
  limite: 2000,
  diaFechamento: 5,
  diaVencimento: 15,
  ativo: true,
};
const financiamento: Financiamento = {
  id: 6,
  descricao: 'Contrato de teste',
  principal: 1000,
  taxaJurosMensal: 1,
  numeroParcelas: 10,
  dataInicio: '2026-10-01',
  contaId: 2,
  status: 'ATIVO',
  cronogramaVersao: 1,
  financiamentoOrigemId: null,
};
const fatura: DetalheFatura = {
  id: 9,
  cartaoId: 4,
  anoMes: '2026-10',
  fechamento: '2026-10-05',
  vencimento: '2026-10-15',
  status: 'FECHADA',
  contaPagamentoId: 2,
  valorTotal: 100,
  valorPago: 0,
  creditoAplicado: 0,
  valorEmAberto: 100,
  credito: 0,
  transacoes: [],
};
function paginar<T>(conteudo: T[]) {
  return {
    conteudo,
    pagina: 0,
    tamanho: 20,
    totalElementos: conteudo.length,
    totalPaginas: conteudo.length ? 1 : 0,
  };
}
async function configurarCenario(
  page: Page,
  tratarRota: (route: Route, caminho: string, metodo: string) => Promise<boolean>,
) {
  await page.addInitScript(() =>
    sessionStorage.setItem(
      'finisus.session',
      JSON.stringify({
        accessToken: 'test-access',
        refreshToken: 'test-refresh',
        expiraEm: '2099-01-01T00:00:00Z',
      }),
    ),
  );
  page.on('dialog', (dialog) => dialog.accept());
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request(),
      caminho = new URL(request.url()).pathname,
      metodo = request.method();
    if (await tratarRota(route, caminho, metodo)) return;
    if (metodo === 'GET' && caminho === '/api/v1/contas') {
      await route.fulfill({
        json: paginar([
          {
            id: 2,
            nome: 'Conta de teste',
            tipo: 'CORRENTE',
            bancoId: null,
            saldo: 5000,
            ativo: true,
          },
        ]),
      });
      return;
    }
    if (
      metodo === 'GET' &&
      [
        '/api/v1/categorias',
        '/api/v1/meios-pagamento',
        '/api/v1/itens',
        '/api/v1/obrigacoes-financeiras',
        '/api/v1/recorrencias',
        '/api/v1/financiamentos',
      ].includes(caminho)
    ) {
      await route.fulfill({ json: paginar([]) });
      return;
    }
    if (metodo === 'GET' && caminho === '/api/v1/cartoes') {
      await route.fulfill({ json: paginar([cartao]) });
      return;
    }
    if (metodo === 'GET' && caminho === '/api/v1/cartoes/4') {
      await route.fulfill({ json: cartao });
      return;
    }
    await route.fulfill({
      status: 500,
      json: {
        status: 500,
        code: 'test.unexpected.endpoint',
        detail: `Endpoint de teste sem contrato: ${metodo} ${caminho}`,
      },
    });
  });
}

test('pagamento parcial da fatura preserva formulário e chave na falha e estorna pelo agregado', async ({
  page,
}) => {
  let atual = { ...fatura };
  const requisicoesPagamento: { corpo: unknown; chave: string | undefined }[] = [];
  let estornos = 0;
  await configurarCenario(page, async (route, caminho, metodo) => {
    if (metodo === 'GET' && caminho === '/api/v1/cartoes/4/faturas') {
      await route.fulfill({ json: paginar([atual]) });
      return true;
    }
    if (metodo === 'GET' && caminho === '/api/v1/cartoes/faturas/9') {
      await route.fulfill({ json: atual });
      return true;
    }
    if (metodo === 'POST' && caminho === '/api/v1/cartoes/faturas/9/pagar') {
      requisicoesPagamento.push({
        corpo: route.request().postDataJSON() as unknown,
        chave: route.request().headers()['idempotency-key'],
      });
      if (requisicoesPagamento.length === 1) {
        await route.fulfill({
          status: 422,
          json: {
            status: 422,
            code: 'error.fatura.pagamento.invalido',
            detail: 'Pagamento temporariamente recusado no ambiente de teste.',
          },
        });
        return true;
      }
      atual = { ...fatura, valorPago: 30, valorEmAberto: 70 };
      await route.fulfill({ json: atual });
      return true;
    }
    if (metodo === 'POST' && caminho === '/api/v1/cartoes/faturas/9/estornar-pagamento') {
      estornos++;
      atual = { ...fatura };
      await route.fulfill({ json: atual });
      return true;
    }
    return false;
  });
  await page.goto('/cartoes');
  await page.getByRole('button', { name: 'Ver detalhes', exact: true }).click();
  await page.getByRole('button', { name: 'Abrir fatura', exact: true }).click();
  await page.getByRole('button', { name: 'Pagar', exact: true }).click();
  await page.getByLabel('Data do pagamento', { exact: true }).fill('2026-10-07');
  await page.getByLabel('Valor parcial (R$)', { exact: true }).fill('30');
  await page.getByRole('button', { name: 'Confirmar dados', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Pagamento temporariamente recusado');
  await expect(page.getByLabel('Valor parcial (R$)', { exact: true })).toHaveValue('30');
  await expect(page.getByLabel('Data do pagamento', { exact: true })).toHaveValue('2026-10-07');
  await page.getByRole('button', { name: 'Confirmar dados', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Pagamento registrado');
  expect(requisicoesPagamento).toHaveLength(2);
  expect(requisicoesPagamento[0]?.corpo).toEqual({
    valor: 30,
    dataPagamento: '2026-10-07',
    contaId: null,
  });
  expect(requisicoesPagamento[0]?.chave).toBeTruthy();
  expect(requisicoesPagamento[1]?.chave).toBe(requisicoesPagamento[0]?.chave);
  const subdetalhe = page.locator('.subdetalhe');
  await expect(subdetalhe.getByText('70,00', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Estornar último pagamento', exact: true }).click();
  await expect(subdetalhe.getByText('100,00', { exact: false }).first()).toBeVisible();
  expect(estornos).toBe(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.evaluate(() => window.scrollTo(0, 0));
});

test('geração mensal cria expectativa e realização usa comando da ocorrência', async ({ page }) => {
  const esperado: Ocorrencia = {
    id: 5,
    recorrenciaId: 3,
    anoMes: '2026-10',
    vencimento: '2026-10-12',
    tipo: 'SAIDA',
    valor: 80,
    descricao: 'Internet de teste',
    contaId: 2,
    categoriaId: null,
    meioPagamentoId: null,
    status: 'PENDENTE',
    transacaoId: null,
  };
  let linhas: Ocorrencia[] = [];
  const comandos: string[] = [];
  await configurarCenario(page, async (route, caminho, metodo) => {
    if (metodo === 'POST' && caminho === '/api/v1/recorrencias/geracoes/2026-10') {
      comandos.push(caminho);
      linhas = [{ ...esperado }];
      await route.fulfill({ json: linhas });
      return true;
    }
    if (metodo === 'GET' && caminho === '/api/v1/recorrencias/ocorrencias/2026-10') {
      await route.fulfill({ json: linhas });
      return true;
    }
    if (metodo === 'POST' && caminho === '/api/v1/recorrencias/ocorrencias/5/realizar') {
      comandos.push(caminho);
      linhas = [{ ...esperado, status: 'REALIZADA', transacaoId: 42 }];
      await route.fulfill({ json: linhas[0] });
      return true;
    }
    return false;
  });
  await page.goto('/compromissos');
  await page.getByRole('button', { name: 'Recorrências', exact: true }).click();
  await page.getByLabel('Mês', { exact: true }).fill('2026-10');
  await page.getByRole('button', { name: 'Gerar compromissos do mês', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Nenhum pagamento foi realizado');
  expect(comandos).toEqual(['/api/v1/recorrencias/geracoes/2026-10']);
  await expect(page.getByText('Internet de teste', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Realizar', exact: true }).click();
  await expect(page.getByText(/Despesa · Realizada/)).toBeVisible();
  expect(comandos).toEqual([
    '/api/v1/recorrencias/geracoes/2026-10',
    '/api/v1/recorrencias/ocorrencias/5/realizar',
  ]);
  await expect(page.getByRole('button', { name: 'Realizar', exact: true })).toBeDisabled();
});

test('pagamento de parcela e amortização preservam comandos e valores do financiamento', async ({
  page,
}) => {
  let atual = { ...financiamento };
  const primeiraParcela: Parcela = {
    id: 11,
    numero: 1,
    valor: 110,
    principal: 100,
    juros: 10,
    encargos: 0,
    saldoDevedorInicial: 1000,
    saldoDevedorFinal: 900,
    vencimento: '2026-10-15',
    status: 'PENDENTE',
    transacaoId: null,
  };
  let parcelas = [
    primeiraParcela,
    {
      ...primeiraParcela,
      id: 12,
      numero: 2,
      vencimento: '2026-11-15',
      saldoDevedorInicial: 900,
      saldoDevedorFinal: 800,
    },
  ];
  const comandos: { caminho: string; corpo: unknown }[] = [];
  await configurarCenario(page, async (route, caminho, metodo) => {
    if (metodo === 'GET' && caminho === '/api/v1/financiamentos') {
      await route.fulfill({ json: paginar([atual]) });
      return true;
    }
    if (metodo === 'GET' && caminho === '/api/v1/financiamentos/6') {
      await route.fulfill({ json: atual });
      return true;
    }
    if (metodo === 'GET' && caminho === '/api/v1/financiamentos/6/parcelas') {
      await route.fulfill({ json: paginar(parcelas) });
      return true;
    }
    if (metodo === 'POST' && caminho === '/api/v1/financiamentos/6/parcelas/11/pagar') {
      comandos.push({ caminho, corpo: route.request().postDataJSON() as unknown });
      parcelas = parcelas.map((parcela) =>
        parcela.id === 11 ? { ...parcela, status: 'PAGA', transacaoId: 43 } : parcela,
      );
      await route.fulfill({ json: parcelas[0] });
      return true;
    }
    if (metodo === 'POST' && caminho === '/api/v1/financiamentos/6/amortizar') {
      comandos.push({ caminho, corpo: route.request().postDataJSON() as unknown });
      atual = { ...atual, cronogramaVersao: 2, numeroParcelas: 9 };
      await route.fulfill({
        json: {
          financiamento: atual,
          transacaoId: 44,
          saldoDevedorAnterior: 900,
          saldoDevedorAtual: 800,
          parcelasRestantes: 9,
        },
      });
      return true;
    }
    return false;
  });
  await page.goto('/compromissos');
  await page.getByRole('button', { name: 'Financiamentos', exact: true }).click();
  await page.getByRole('button', { name: 'Ver detalhes', exact: true }).click();
  await page.getByRole('button', { name: 'Pagar parcela', exact: true }).first().click();
  await page.getByLabel('Data do pagamento', { exact: true }).fill('2026-10-07');
  await page.getByRole('button', { name: 'Confirmar dados', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Operação concluída');
  expect(comandos[0]).toEqual({
    caminho: '/api/v1/financiamentos/6/parcelas/11/pagar',
    corpo: { dataPagamento: '2026-10-07' },
  });
  await page.getByRole('button', { name: 'Amortizar', exact: true }).click();
  await page.getByLabel('Valor de amortização (R$)', { exact: true }).fill('100');
  await page.getByLabel('Data do pagamento', { exact: true }).fill('2026-10-07');
  await page.getByRole('combobox', { name: 'Modalidade', exact: true }).click();
  await page.getByRole('option', { name: 'Reduzir prestação', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar dados', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Amortização registrada', exact: true }),
  ).toBeVisible();
  expect(comandos[1]).toEqual({
    caminho: '/api/v1/financiamentos/6/amortizar',
    corpo: {
      valor: 100,
      dataPagamento: '2026-10-07',
      numeroParcelasRestantes: null,
      modalidade: 'REDUZIR_PRESTACAO',
    },
  });
  await expect(page.getByText(/Saldo devedor anterior/)).toContainText('800,00');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.evaluate(() => window.scrollTo(0, 0));
});
