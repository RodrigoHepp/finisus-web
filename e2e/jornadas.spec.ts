import { test, expect, Page } from '@playwright/test';
async function configurarSessao(page: Page, permissoes: string[] = []) {
  await page.addInitScript(
    (permissoes) =>
      sessionStorage.setItem(
        'finisus.session',
        JSON.stringify({
          accessToken: `e30.${btoa(JSON.stringify({ sub: '99', permissoes }))
            .replace(/=/g, '')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')}.test`,
          refreshToken: 'test-refresh',
          expiraEm: '2099-01-01T00:00:00Z',
        }),
      ),
    permissoes,
  );
}
test('cadastro antigo redireciona ao login sem criação pública de usuário', async ({ page }) => {
  let requisicoes = 0;
  await page.route('**/api/v1/auth/cadastro', (route) => {
    requisicoes++;
    return route.fulfill({ status: 403, json: { code: 'error.auth.forbidden' } });
  });
  await page.goto('/cadastro');
  await expect(page).toHaveURL(/entrar.*retorno/);
  await expect(page.getByRole('heading', { name: 'Entre na sua conta' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Criar conta' })).toHaveCount(0);
  await expect(page.getByLabel('Nome', { exact: true })).toHaveCount(0);
  expect(requisicoes).toBe(0);
  expect(await page.evaluate(() => sessionStorage.getItem('finisus.session'))).toBeNull();
});

test('usuário comum não acessa administração e login bloqueado explica desbloqueio manual', async ({
  page,
}) => {
  await configurarSessao(page);
  await page.route('**/api/v1/**', (route) => route.fulfill({ json: {} }));
  await page.goto('/usuarios');
  await expect(page).toHaveURL(/visao-geral/);
  await expect(page.getByRole('link', { name: 'Usuários e acesso' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Cadastrar usuário' })).toHaveCount(0);
  await page.route('**/api/v1/auth/login', (route) =>
    route.fulfill({ status: 423, json: { code: 'error.usuario.bloqueado' } }),
  );
  await page.goto('/entrar');
  await page.getByLabel('E-mail', { exact: true }).fill('bloqueado@example.test');
  await page.getByLabel('Senha', { exact: true }).fill('senhaTeste123');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('bloqueado');
  await expect(page.getByRole('alert')).toContainText('desbloqueio');
});

test('permissões separam cadastro e desbloqueio e comandos administrativos usam Bearer', async ({
  page,
}) => {
  await configurarSessao(page, ['USUARIO_CADASTRAR']);
  let bearer = '';
  await page.route('**/api/v1/auth/cadastro', (route) => {
    bearer = route.request().headers()['authorization'] ?? '';
    return route.fulfill({
      status: 201,
      json: { id: 12, nome: 'Pessoa de teste', email: 'teste@example.test' },
    });
  });
  await page.goto('/usuarios');
  await expect(page.getByRole('heading', { name: 'Cadastrar usuário', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Desbloquear usuário', exact: true })).toHaveCount(
    0,
  );
  const anterior = await page.evaluate(() => sessionStorage.getItem('finisus.session'));
  await page.getByLabel('Nome', { exact: true }).fill('Pessoa de teste');
  await page.getByLabel('E-mail', { exact: true }).fill('teste@example.test');
  await page.getByLabel('Senha inicial', { exact: true }).fill('senhaTeste123');
  await page.getByRole('button', { name: 'Cadastrar usuário', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('ID 12');
  expect(bearer).toMatch(/^Bearer /);
  expect(await page.evaluate(() => sessionStorage.getItem('finisus.session'))).toBe(anterior);
});

test('permissão de desbloqueio não concede cadastro e trata resposta sem conteúdo', async ({
  page,
}) => {
  await configurarSessao(page, ['USUARIO_DESBLOQUEAR']);
  await page.route('**/api/v1/usuarios/12/desbloquear', (route) => {
    expect(route.request().headers()['authorization']).toMatch(/^Bearer /);
    return route.fulfill({ status: 204 });
  });
  page.on('dialog', (dialog) => dialog.accept());
  await page.goto('/usuarios');
  await expect(page.getByRole('heading', { name: 'Cadastrar usuário', exact: true })).toHaveCount(
    0,
  );
  await page.getByLabel('ID do usuário', { exact: true }).fill('12');
  await page.getByRole('button', { name: 'Desbloquear usuário', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('precisa entrar novamente');
});
test('visão geral preserva valores do servidor e responde no celular', async ({ page }, info) => {
  await configurarSessao(page);
  await page.route('**/api/v1/dashboard/visao-geral?**', (r) =>
    r.fulfill({
      json: {
        referencia: '2026-10-07',
        saldoContas: 3210.75,
        resultadoCompetenciaOperacional: 150,
        resultadoCaixa: 89.25,
        comprometidoNaJanela: 900,
        saldoLivreNaJanela: 2310.75,
        maioresGastos: [],
        alertas: [],
      },
    }),
  );
  await page.goto('/visao-geral');
  await expect(page.getByRole('heading', { name: 'Visão financeira' })).toBeVisible();
  await expect(page.getByText('3.210,75', { exact: false })).toBeVisible();
  await expect(page.getByText('2.310,75', { exact: false })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  if (info.project.name === 'mobile') {
    await page.getByRole('button', { name: 'Abrir navegação' }).click();
    await expect(page.getByRole('link', { name: 'Movimentações', exact: true })).toBeVisible();
  }
});
test('falha de API apresenta indisponibilidade sem inventar saldo', async ({ page }) => {
  await configurarSessao(page);
  await page.route('**/api/v1/**', (r) => r.abort());
  await page.goto('/visao-geral');
  await expect(page.getByRole('alert')).toContainText('servidor');
  await expect(page.locator('.resultados-relatorio')).toHaveCount(0);
});

test('navegação fechada preserva foco visível e menu devolve foco ao botão', async ({ page }) => {
  await configurarSessao(page);
  await page.route('**/api/v1/**', (r) => r.fulfill({ json: {} }));
  await page.goto('/visao-geral');
  const navegacaoLateral = page.locator('.barra-lateral');
  const dispositivoMovel = (page.viewportSize()?.width ?? 0) <= 760;
  if (!dispositivoMovel) {
    await expect(page.getByRole('link', { name: 'Movimentações', exact: true })).toBeVisible();
    await expect(navegacaoLateral).not.toHaveAttribute('inert', '');
    return;
  }
  await expect(navegacaoLateral).toHaveAttribute('inert', '');
  for (let indice = 0; indice < 4; indice++) {
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();
    expect(
      await navegacaoLateral.evaluate((element) => element.contains(document.activeElement)),
    ).toBe(false);
  }
  const botaoNavegacao = page.getByRole('button', { name: 'Abrir navegação' });
  await botaoNavegacao.click();
  await expect(navegacaoLateral).not.toHaveAttribute('inert', '');
  await expect(page.getByRole('button', { name: 'Fechar menu', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(botaoNavegacao).toBeFocused();
  await expect(navegacaoLateral).toHaveAttribute('inert', '');
  await botaoNavegacao.click();
  await page.getByRole('button', { name: 'Fechar menu', exact: true }).click();
  await expect(botaoNavegacao).toBeFocused();
  await page.setViewportSize({ width: 1200, height: 900 });
  await expect(navegacaoLateral).not.toHaveAttribute('inert', '');
  await expect(page.getByRole('link', { name: 'Movimentações', exact: true })).toBeVisible();
});
test('relatórios inválidos removem resultado anterior e paginação usa português', async ({
  page,
}) => {
  await configurarSessao(page);
  await page.route('**/api/v1/**', (route) =>
    route.fulfill({
      json: { saldoContas: 123.45, linhas: { conteudo: [], totalElementos: 23 } },
    }),
  );
  await page.goto('/relatorios');
  const escolher = async (rotulo: string) => {
    await page.getByRole('combobox', { name: 'Consulta financeira' }).click();
    await page.getByRole('option', { name: rotulo, exact: true }).click();
    await expect(page.getByRole('listbox')).toHaveCount(0);
    await expect(page.locator('mat-select .mat-mdc-select-value-text').first()).toHaveText(rotulo);
  };
  await escolher('Resultado anual');
  await page.getByLabel('Ano', { exact: true }).fill('');
  await escolher('Resultado mensal');
  await expect(page.locator('.resultados-relatorio')).toContainText('123,45');
  await escolher('Resultado anual');
  await expect(page.locator('.resultados-relatorio')).toHaveCount(0);
  await expect(page.locator('mat-error')).toContainText('ano');
  await escolher('Balancete mensal');
  await expect(page.locator('mat-paginator')).toContainText('Itens por página');
  await expect(page.locator('mat-paginator')).toContainText('1 – 20 de 23');
  await expect(page.getByRole('button', { name: 'Próxima página' })).toBeVisible();
});

test('guard preserva rota solicitada e teclado alcança formulário', async ({ page }) => {
  await page.goto('/contas');
  await expect(page).toHaveURL(/entrar.*retorno/);
  await page.keyboard.press('Tab');
  await expect(page.locator(':focus')).toBeVisible();
});
test('patrimônio informa limitação histórica sem agregar custódia', async ({ page }) => {
  await configurarSessao(page);
  await page.route('**/api/v1/dashboard/visao-geral?**', (r) =>
    r.fulfill({
      json: {
        referencia: '2026-10-07',
        saldoContas: 0,
        resultadoCompetenciaOperacional: 0,
        resultadoCaixa: 0,
        comprometidoNaJanela: 0,
        saldoLivreNaJanela: 0,
        maioresGastos: [],
        alertas: [],
      },
    }),
  );
  await page.route('**/api/v1/dashboard/patrimonio?**', (r) =>
    r.fulfill({
      json: {
        referencia: '2026-10-07',
        saldosEDividasConsultadosEm: '2026-10-07T12:00:00Z',
        patrimonioHistoricoCompleto: false,
        saldoContas: 100,
        capitalLiquidoInvestido: 50,
        valorAtualInvestimentos: 60,
        faturasEmAberto: 0,
        obrigacoesEmAberto: 0,
        parcelasFinanciamentoEmAberto: 0,
        principalFinanciamentosEmAberto: 0,
        jurosEncargosFinanciamentosFuturos: 0,
        parcelasFinanciamentoSemComposicao: 0,
        comprasParceladasRestantes: 0,
        dividasPrincipais: 0,
        dividasECompromissos: 0,
        patrimonioLiquido: 160,
        investimentos: [],
      },
    }),
  );
  await page.goto('/visao-geral');
  await page.getByRole('combobox', { name: 'Consulta financeira' }).click();
  await page.getByRole('option', { name: 'Patrimônio', exact: true }).click();
  await expect(page.getByText(/não é uma fotografia histórica integral/)).toBeVisible();
  await expect(page.getByText('160,00', { exact: false })).toBeVisible();
});
