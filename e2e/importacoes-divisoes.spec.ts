import { test, expect, Page } from '@playwright/test';

async function configurarSessao(page: Page): Promise<void> {
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
}
const lancamentoImportado = {
  id: 21,
  ordem: 1,
  data: '2026-10-07',
  descricao: 'Mercado',
  conteudoOriginal: '07/10 Mercado 40,12',
  dataOriginal: '2026-10-07',
  descricaoOriginal: 'Mercado',
  valorOriginal: 40.12,
  tipoOriginal: 'SAIDA',
  valor: 40.12,
  tipo: 'SAIDA',
  pendenteConfirmacao: true,
  motivoPendencia: 'Conferir registro',
  estado: 'PENDENTE',
  importar: true,
  categoriaId: null,
  itemId: null,
  transacaoId: null,
  obrigacaoFinanceiraId: null,
  revisoes: [],
};
const documentoImportado = {
  id: 5,
  bancoId: 2,
  nomeArquivo: 'extrato.pdf',
  leitor: 'leitor',
  tipoDocumento: 'EXTRATO_CONTA',
  tipoDocumentoPretendido: 'EXTRATO_CONTA',
  identificadorOrigem: null,
  periodoInicio: '2026-10-01',
  periodoFim: '2026-10-07',
  dataVencimento: null,
  saldoInicial: 0,
  saldoFinal: 0,
  valorTotal: null,
  status: 'PENDENTE_REVISAO',
  contaId: 7,
  faturaId: null,
  lancamentos: [lancamentoImportado],
};

test('importação exige revisão explícita e associa transação existente antes da confirmação', async ({
  page,
}) => {
  await configurarSessao(page);
  const transacoesArtificiais: string[] = [];
  page.on('request', (request) => {
    if (request.method() === 'POST' && /\/transacoes$/.test(new URL(request.url()).pathname))
      transacoesArtificiais.push(request.url());
  });
  const revisaoImportacao = {
    importacao: documentoImportado,
    possiveisDuplicidades: [
      {
        lancamentoImportadoId: 21,
        transacaoId: 99,
        transferenciaId: null,
        obrigacaoFinanceiraId: null,
        data: '2026-10-07',
        valor: 40.12,
        descricao: 'Mercado',
        nivel: 'EXATA',
        evidencias: ['Mesmo valor e data'],
      },
    ],
    divergencias: [],
  };
  let enviado: unknown;
  await page.route('**/api/v1/importacoes-financeiras/5', (route) =>
    route.fulfill({ json: revisaoImportacao }),
  );
  await page.route('**/api/v1/importacoes-financeiras/5/revisao', (route) => {
    enviado = route.request().postDataJSON();
    return route.fulfill({
      json: {
        ...revisaoImportacao,
        importacao: {
          ...documentoImportado,
          lancamentos: [{ ...lancamentoImportado, transacaoId: 99, pendenteConfirmacao: false }],
        },
      },
    });
  });
  await page.route('**/api/v1/importacoes-financeiras/5/confirmar', (route) =>
    route.fulfill({
      json: {
        ...documentoImportado,
        status: 'CONFIRMADA',
        lancamentos: [
          {
            ...lancamentoImportado,
            transacaoId: 99,
            estado: 'ASSOCIADA',
            pendenteConfirmacao: false,
          },
        ],
      },
    }),
  );
  await page.goto('/importacoes');
  await page.getByLabel('Identificador da importação', { exact: true }).fill('5');
  await page.getByRole('button', { name: 'Buscar importação', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Possíveis duplicidades' })).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Confirmar importação', exact: true }),
  ).toBeDisabled();
  await page.getByLabel('Decisão deste lançamento').click();
  await page.getByRole('option', { name: 'Associar transação existente', exact: true }).click();
  await page.getByLabel('Identificador existente', { exact: true }).fill('99');
  await page
    .getByLabel('Justificativa da decisão')
    .fill('Transação já registrada na mesma conta, data e valor.');
  await page.getByRole('button', { name: 'Salvar revisão', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Confirmar importação', exact: true }),
  ).toBeEnabled();
  expect(enviado).toEqual({
    contaId: 7,
    faturaId: null,
    lancamentos: [
      {
        id: 21,
        data: '2026-10-07',
        descricao: 'Mercado',
        valor: 40.12,
        tipo: 'SAIDA',
        importar: true,
        categoriaId: null,
        itemId: null,
        transacaoId: 99,
        obrigacaoFinanceiraId: null,
        justificativa: 'Transação já registrada na mesma conta, data e valor.',
      },
    ],
  });
  await page.getByRole('button', { name: 'Confirmar importação', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Resultado confirmado' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Transação #99', exact: true })).toBeVisible();
  expect(transacoesArtificiais).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.locator('mat-error:visible')).toHaveCount(0);
  await page.evaluate(() => window.scrollTo(0, 0));
});

test('reembolso usa transação real e preserva formulário após erro do servidor', async ({
  page,
}) => {
  await configurarSessao(page);
  const divisao = {
    id: 2,
    nome: 'Casa',
    criadorId: 4,
    status: 'ATIVA',
    participantes: [
      { usuarioId: 4, percentual: 50 },
      { usuarioId: 5, percentual: 50 },
    ],
  };
  const paginaVazia = { conteudo: [], pagina: 0, tamanho: 20, totalElementos: 0, totalPaginas: 0 };
  let reembolsos: object[] = [];
  let tentativas = 0;
  const comandos: unknown[] = [];
  await page.route('**/api/v1/usuarios/me', (route) =>
    route.fulfill({
      json: { id: 4, nome: 'Pessoa de teste', email: 'teste@example.test', ativo: true },
    }),
  );
  const requisicoesLegadas: string[] = [];
  page.on('request', (request) => {
    const caminho = new URL(request.url()).pathname;
    if (
      /^\/api\/v1\/compartilhamentos(?:\/|$)/.test(caminho) &&
      caminho !== '/api/v1/compartilhamentos/opt-in'
    )
      requisicoesLegadas.push(caminho);
  });
  await page.route('**/api/v1/compartilhamentos/opt-in', (route) =>
    route.fulfill({ json: { aceita: true } }),
  );
  await page.route('**/api/v1/divisoes-compartilhadas**', (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith('/reembolsos') && route.request().method() === 'POST') {
      comandos.push(route.request().postDataJSON());
      tentativas++;
      if (tentativas === 1)
        return route.fulfill({
          status: 422,
          json: { detail: 'O valor excede o saldo a compensar.' },
        });
      const resultado = {
        id: 18,
        transacaoId: 82,
        pagadorId: 4,
        recebedorId: 5,
        valor: 15.01,
        data: '2026-10-07',
        criadoEm: '2026-10-07T12:00:00',
        canceladoEm: null,
        canceladoPor: null,
      };
      reembolsos = [resultado];
      return route.fulfill({ status: 201, json: resultado });
    }
    if (url.pathname.endsWith('/reembolsos')) return route.fulfill({ json: reembolsos });
    if (url.pathname.endsWith('/resumo'))
      return route.fulfill({
        json: {
          divisaoId: 2,
          divisao: 'Casa',
          total: 100,
          participantes: [
            { usuarioId: 4, percentual: 50, pago: 25, devido: 50, saldo: -25 },
            { usuarioId: 5, percentual: 50, pago: 75, devido: 50, saldo: 25 },
          ],
          lancamentosPendentesRevisao: 0,
        },
      });
    if (
      url.pathname.endsWith('/participantes/historico') ||
      url.pathname.endsWith('/pendentes-revisao')
    )
      return route.fulfill({ json: [] });
    if (url.pathname.endsWith('/2')) return route.fulfill({ json: divisao });
    return route.fulfill({
      json: { ...paginaVazia, conteudo: [divisao], totalElementos: 1, totalPaginas: 1 },
    });
  });
  await page.goto('/compartilhamentos');
  await expect(page.getByRole('heading', { name: 'Divisões', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Rateios recebidos', exact: true })).toHaveCount(
    0,
  );
  await expect(
    page.getByRole('button', { name: 'Compartilhar despesa existente', exact: true }),
  ).toHaveCount(0);
  expect(requisicoesLegadas).toEqual([]);
  await page.getByRole('button', { name: 'Abrir', exact: true }).click();
  await page.getByLabel('Transação real do reembolso', { exact: true }).fill('82');
  await page.getByLabel('Participante recebedor', { exact: true }).click();
  await page.getByRole('option', { name: 'Usuário #5', exact: true }).click();
  await page.getByLabel('Valor reembolsado (R$)', { exact: true }).fill('15.01');
  await page.getByRole('button', { name: 'Registrar vínculo de reembolso', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('excede o saldo');
  await expect(page.getByLabel('Transação real do reembolso', { exact: true })).toHaveValue('82');
  await expect(page.getByLabel('Valor reembolsado (R$)', { exact: true })).toHaveValue('15.01');
  await page.getByRole('button', { name: 'Registrar vínculo de reembolso', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page.getByRole('cell', { name: '#82', exact: true })).toBeVisible();
  expect(comandos).toEqual([
    { transacaoId: 82, recebedorId: 5, valor: 15.01 },
    { transacaoId: 82, recebedorId: 5, valor: 15.01 },
  ]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.locator('mat-error:visible')).toHaveCount(0);
  await page.evaluate(() => window.scrollTo(0, 0));
});
