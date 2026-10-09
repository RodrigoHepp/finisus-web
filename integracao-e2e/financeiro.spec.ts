import { APIRequestContext, Page, test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import type { Conta, Transferencia, Transacao } from '../src/app/features/dia-a-dia/dia-a-dia.api';
import type {
  DetalheFatura,
  Obrigacao,
  PagamentoObrigacao,
  Ocorrencia,
  Financiamento,
  Parcela,
} from '../src/app/features/compromissos/compromissos.api';
import type {
  DivisaoCompartilhada,
  ResumoDivisao,
  Alocacao,
  Reembolso,
} from '../src/app/features/divisoes-compartilhadas/divisoes-compartilhadas.api';
import type {
  Investimento,
  MovimentoInvestimento,
  PosicaoInvestimento,
} from '../src/app/features/investimentos/investimentos.api';
import type {
  RevisaoImportacao,
  DocumentoImportacao,
} from '../src/app/features/importacoes/importacoes.api';
import type { TokensSessao } from '../src/app/infraestrutura/sessao/sessao.service';
import type { Pagina } from '../src/app/infraestrutura/api/backend.dtos';
const api = 'http://localhost:8080/api/v1';
interface UsuarioTeste {
  id: number;
  email: string;
  senha: string;
  tokens: TokensSessao;
}
async function chamarApi<T>(
  request: APIRequestContext,
  usuario: Pick<UsuarioTeste, 'tokens'> | null,
  metodo: string,
  caminho: string,
  dados?: unknown,
  chave?: string,
): Promise<T> {
  const resposta = await request.fetch(`${api}${caminho}`, {
    method: metodo,
    data: dados,
    headers: {
      ...(usuario ? { Authorization: `Bearer ${usuario.tokens.accessToken}` } : {}),
      ...(chave ? { 'Idempotency-Key': chave } : {}),
    },
  });
  expect(resposta.ok(), `${metodo} ${caminho}: HTTP ${resposta.status()}`).toBe(true);
  return resposta.status() === 204 ? (undefined as T) : ((await resposta.json()) as T);
}
async function criarUsuario(
  request: APIRequestContext,
  administrador: Pick<UsuarioTeste, 'tokens'>,
): Promise<UsuarioTeste> {
  const id = randomUUID();
  const email = `finisus.e2e.${id}@example.test`;
  const senha = `Test!${randomUUID()}`;
  const usuario = await chamarApi<{ id: number }>(
    request,
    administrador,
    'POST',
    '/auth/cadastro',
    {
      nome: 'Finisus integração fictícia',
      email,
      senha,
    },
  );
  const tokens = await chamarApi<TokensSessao>(request, null, 'POST', '/auth/login', {
    email,
    senha,
  });
  return { id: usuario.id, email, senha, tokens };
}
async function abrirComSessao(page: Page, usuario: UsuarioTeste, caminho: string) {
  await page.addInitScript(
    (tokens) => sessionStorage.setItem('finisus.session', JSON.stringify(tokens)),
    usuario.tokens,
  );
  await page.goto(caminho);
}
function pdf(linhas: string[]): Buffer {
  const stream = `BT /F1 12 Tf 50 760 Td ${linhas.map((linha, indice) => `${indice ? '0 -18 Td ' : ''}(${linha.replace(/[\\()]/g, '\\$&')}) Tj`).join('\n')} ET`;
  const objetos = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
  ];
  let conteudo = '%PDF-1.4\n';
  const deslocamentos = [0];
  objetos.forEach((objeto, indice) => {
    deslocamentos.push(Buffer.byteLength(conteudo));
    conteudo += `${indice + 1} 0 obj\n${objeto}\nendobj\n`;
  });
  const xref = Buffer.byteLength(conteudo);
  conteudo += `xref\n0 6\n0000000000 65535 f \n${deslocamentos
    .slice(1)
    .map((deslocamento) => `${String(deslocamento).padStart(10, '0')} 00000 n \n`)
    .join('')}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(conteudo);
}
test.describe('Backend real com usuários e dados fictícios autorizados', () => {
  const emailAdministrador = process.env['FINISUS_E2E_ADMIN_EMAIL'];
  const senhaAdministrador = process.env['FINISUS_E2E_ADMIN_PASSWORD'];
  test.skip(
    !emailAdministrador || !senhaAdministrador,
    'A suíte financeira exige administrador de teste autorizado em FINISUS_E2E_ADMIN_EMAIL/PASSWORD; não cria usuários publicamente.',
  );
  let usuarioPrincipal: UsuarioTeste;
  let usuarioParticipante: UsuarioTeste;
  let origem: Conta;
  let destino: Conta;
  let bancoId: number;
  test.beforeEach(async ({ page }) => {
    page.on('dialog', (dialog) => dialog.accept());
  });
  test.beforeAll(async ({ request }) => {
    const tokensAdministrador = await chamarApi<TokensSessao>(
      request,
      null,
      'POST',
      '/auth/login',
      {
        email: emailAdministrador,
        senha: senhaAdministrador,
      },
    );
    const administrador = { tokens: tokensAdministrador };
    usuarioPrincipal = await criarUsuario(request, administrador);
    usuarioParticipante = await criarUsuario(request, administrador);
    const banco = await chamarApi<{ id: number }>(request, usuarioPrincipal, 'POST', '/bancos', {
      nome: 'Banco fictício integração',
      codigo: `T${randomUUID().slice(0, 8)}`,
    });
    bancoId = banco.id;
    origem = await chamarApi<Conta>(request, usuarioPrincipal, 'POST', '/contas', {
      nome: 'Origem fictícia',
      tipo: 'CORRENTE',
      bancoId: bancoId,
    });
    destino = await chamarApi<Conta>(request, usuarioPrincipal, 'POST', '/contas', {
      nome: 'Destino fictício',
      tipo: 'CORRENTE',
      bancoId: bancoId,
    });
    await chamarApi(
      request,
      usuarioPrincipal,
      'POST',
      `/contas/${origem.id}/ajustes-saldo`,
      { saldoInformado: 10000, motivo: 'Saldo fictício para teste autorizado' },
      randomUUID(),
    );
    await chamarApi(request, usuarioPrincipal, 'PUT', '/compartilhamentos/opt-in', {
      aceita: true,
    });
    await chamarApi(request, usuarioParticipante, 'PUT', '/compartilhamentos/opt-in', {
      aceita: true,
    });
  });
  test.afterAll(async ({ request }) => {
    // A inativação preserva o histórico auditável destas fixtures explicitamente fictícias.
    if (usuarioPrincipal) await chamarApi(request, usuarioPrincipal, 'DELETE', '/usuarios/me');
    if (usuarioParticipante)
      await chamarApi(request, usuarioParticipante, 'DELETE', '/usuarios/me');
  });
  test('login pela interface, rotação real de refresh e isolamento entre usuários', async ({
    page,
    request,
  }) => {
    await page.goto('/entrar');
    await page.getByLabel('E-mail', { exact: true }).fill(usuarioPrincipal.email);
    await page.getByLabel('Senha', { exact: true }).fill(usuarioPrincipal.senha);
    await page.getByRole('button', { name: 'Entrar', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Visão financeira' })).toBeVisible();
    await expect(page.locator('.resultados-relatorio')).toBeVisible();
    const tokenAnterior = usuarioPrincipal.tokens.refreshToken;
    usuarioPrincipal.tokens = await chamarApi<TokensSessao>(
      request,
      null,
      'POST',
      '/auth/refresh',
      {
        refreshToken: tokenAnterior,
      },
    );
    expect(usuarioPrincipal.tokens.refreshToken === tokenAnterior).toBe(false);
    const tokenReutilizado = await request.post(`${api}/auth/refresh`, {
      data: { refreshToken: tokenAnterior },
    });
    expect(tokenReutilizado.ok()).toBe(false);
    const negado = await request.get(`${api}/contas/${origem.id}`, {
      headers: { Authorization: `Bearer ${usuarioParticipante.tokens.accessToken}` },
    });
    expect([403, 404, 422]).toContain(negado.status());
  });
  test('transferência pela interface, replay idempotente e estorno único', async ({
    page,
    request,
  }) => {
    await abrirComSessao(page, usuarioPrincipal, '/contas');
    await page.getByRole('button', { name: 'Escolher conta de origem', exact: true }).click();
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Origem fictícia', exact: true })
      .click();
    await page.getByRole('button', { name: 'Escolher conta de destino', exact: true }).click();
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Destino fictício', exact: true })
      .click();
    await page.getByLabel('Valor (R$)', { exact: true }).fill('125.50');
    await page.getByLabel('Data da transferência', { exact: true }).fill('2026-10-07');
    await page
      .getByLabel('Descrição da transferência', { exact: true })
      .fill('Transferência fictícia real');
    const resposta = page.waitForResponse(
      (r) => r.url() === `${api}/transferencias` && r.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Confirmar transferência', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Confirmar', exact: true }).click();
    const resultado = await resposta;
    expect(resultado.ok()).toBe(true);
    const transferencia = (await resultado.json()) as Transferencia;
    const chave = resultado.request().headers()['idempotency-key'];
    expect(chave).toBeTruthy();
    const repeticao = await chamarApi<Transferencia>(
      request,
      usuarioPrincipal,
      'POST',
      '/transferencias',
      resultado.request().postDataJSON() as unknown,
      chave,
    );
    expect(repeticao.id).toBe(transferencia.id);
    const saldo = await chamarApi<Conta>(request, usuarioPrincipal, 'GET', `/contas/${destino.id}`);
    expect(saldo.saldo).toBe(125.5);
    await page.getByRole('button', { name: 'Estornar transferência', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Confirmar', exact: true }).click();
    await expect(
      page.getByText('Transferência fictícia real · Estornada', { exact: true }),
    ).toBeVisible();
    expect(
      (await chamarApi<Conta>(request, usuarioPrincipal, 'GET', `/contas/${destino.id}`)).saldo,
    ).toBe(0);
  });
  test('fatura real preserva pagamento parcial, crédito excedente e alcance do estorno', async ({
    page,
    request,
  }) => {
    const cartao = await chamarApi<{ id: number }>(request, usuarioPrincipal, 'POST', '/cartoes', {
      nome: 'Cartão fictício',
      limite: 3000,
      diaFechamento: 10,
      diaVencimento: 20,
    });
    const fatura = await chamarApi<DetalheFatura>(
      request,
      usuarioPrincipal,
      'POST',
      '/cartoes/faturas',
      {
        cartaoId: cartao.id,
        anoMes: '2026-10',
        dataFechamento: '2026-10-10',
        dataVencimento: '2026-10-20',
        contaPagamentoId: origem.id,
      },
    );
    await chamarApi(request, usuarioPrincipal, 'POST', `/cartoes/faturas/${fatura.id}/gastos`, {
      valor: 100,
      data: '2026-10-07',
      descricao: 'Compra fictícia',
      contaId: origem.id,
      categoriaId: null,
      itens: [],
    });
    await chamarApi(request, usuarioPrincipal, 'POST', `/cartoes/faturas/${fatura.id}/fechar`, {});
    await abrirComSessao(page, usuarioPrincipal, '/cartoes');
    await page.getByRole('button', { name: 'Ver detalhes', exact: true }).click();
    await page.getByRole('button', { name: 'Abrir fatura', exact: true }).click();
    await page.getByRole('button', { name: 'Pagar', exact: true }).click();
    await page.getByLabel('Data do pagamento', { exact: true }).fill('2026-10-07');
    await page.getByLabel('Valor parcial (R$)', { exact: true }).fill('30');
    await page.getByRole('button', { name: 'Confirmar dados', exact: true }).click();
    await expect(page.getByRole('status')).toContainText('Pagamento registrado');
    let atual = await chamarApi<DetalheFatura>(
      request,
      usuarioPrincipal,
      'GET',
      `/cartoes/faturas/${fatura.id}`,
    );
    expect(atual.valorPago).toBe(30);
    expect(atual.valorEmAberto).toBe(70);
    await chamarApi(
      request,
      usuarioPrincipal,
      'POST',
      `/cartoes/faturas/${fatura.id}/pagar`,
      { valor: 90, dataPagamento: '2026-10-07', contaId: origem.id },
      randomUUID(),
    );
    atual = await chamarApi<DetalheFatura>(
      request,
      usuarioPrincipal,
      'GET',
      `/cartoes/faturas/${fatura.id}`,
    );
    expect(atual.credito).toBe(20);
    expect(atual.valorEmAberto).toBe(0);
    await chamarApi(
      request,
      usuarioPrincipal,
      'POST',
      `/cartoes/faturas/${fatura.id}/estornar-pagamento`,
      {},
    );
    atual = await chamarApi<DetalheFatura>(
      request,
      usuarioPrincipal,
      'GET',
      `/cartoes/faturas/${fatura.id}`,
    );
    expect(atual.valorPago).toBe(30);
    expect(atual.valorEmAberto).toBe(70);
  });
  test('obrigação e recorrência distinguem compromisso de movimentação efetiva', async ({
    request,
  }) => {
    const antes = await chamarApi<Conta>(request, usuarioPrincipal, 'GET', `/contas/${origem.id}`);
    const obrigacao = await chamarApi<Obrigacao>(
      request,
      usuarioPrincipal,
      'POST',
      '/obrigacoes-financeiras',
      {
        descricao: 'Obrigação fictícia',
        credor: 'Credor fictício',
        valor: 100,
        dataVencimento: '2026-10-15',
        contaPagamentoId: origem.id,
        categoriaId: null,
      },
    );
    expect(
      (await chamarApi<Conta>(request, usuarioPrincipal, 'GET', `/contas/${origem.id}`)).saldo,
    ).toBe(antes.saldo);
    const pago = await chamarApi<Obrigacao>(
      request,
      usuarioPrincipal,
      'POST',
      `/obrigacoes-financeiras/${obrigacao.id}/pagar`,
      { valor: 30, dataPagamento: '2026-10-07', juros: 2, encargos: 1, desconto: 0 },
    );
    expect(pago.saldoPendente).toBe(70);
    const pagamentos = await chamarApi<PagamentoObrigacao[]>(
      request,
      usuarioPrincipal,
      'GET',
      `/obrigacoes-financeiras/${obrigacao.id}/pagamentos`,
    );
    expect(pagamentos[0].valorCaixa).toBe(33);
    await chamarApi(
      request,
      usuarioPrincipal,
      'POST',
      `/obrigacoes-financeiras/${obrigacao.id}/pagamentos/${pagamentos[0].id}/estornar`,
      {},
    );
    const recorrencia = await chamarApi<{ id: number }>(
      request,
      usuarioPrincipal,
      'POST',
      '/recorrencias',
      {
        nome: 'Recorrência fictícia',
        tipo: 'SAIDA',
        valorEsperado: 25,
        diaDoMes: 15,
        contaId: origem.id,
        categoriaId: null,
        meioPagamentoId: null,
      },
    );
    const saldo = await chamarApi<Conta>(request, usuarioPrincipal, 'GET', `/contas/${origem.id}`);
    const ocorrencias = await chamarApi<Ocorrencia[]>(
      request,
      usuarioPrincipal,
      'POST',
      '/recorrencias/geracoes/2026-10',
      {},
    );
    expect(
      (await chamarApi<Conta>(request, usuarioPrincipal, 'GET', `/contas/${origem.id}`)).saldo,
    ).toBe(saldo.saldo);
    const ocorrencia = ocorrencias.find(
      (ocorrenciaAtual) => ocorrenciaAtual.recorrenciaId === recorrencia.id,
    );
    expect(ocorrencia).toBeTruthy();
    const realizada = await chamarApi<Ocorrencia>(
      request,
      usuarioPrincipal,
      'POST',
      `/recorrencias/ocorrencias/${ocorrencia!.id}/realizar`,
      {},
    );
    expect(realizada.status).toBe('REALIZADA');
    expect(realizada.transacaoId).toBeTruthy();
  });
  test('financiamento paga e estorna parcelas pelo agregado real', async ({ request }) => {
    const financiamento = await chamarApi<Financiamento>(
      request,
      usuarioPrincipal,
      'POST',
      '/financiamentos',
      {
        descricao: 'Financiamento fictício',
        principal: 1000,
        taxaJurosMensal: 1,
        numeroParcelas: 10,
        dataInicio: '2026-10-01',
        contaId: origem.id,
      },
    );
    const parcelas = await chamarApi<Pagina<Parcela>>(
      request,
      usuarioPrincipal,
      'GET',
      `/financiamentos/${financiamento.id}/parcelas`,
    );
    const parcela = parcelas.conteudo[0];
    await chamarApi(
      request,
      usuarioPrincipal,
      'POST',
      `/financiamentos/${financiamento.id}/parcelas/${parcela.id}/pagar`,
      { dataPagamento: '2026-10-07' },
    );
    await chamarApi(
      request,
      usuarioPrincipal,
      'POST',
      `/financiamentos/${financiamento.id}/parcelas/${parcela.id}/estornar-pagamento`,
      {},
    );
  });
  test('amortização real cria nova versão de cronograma', async ({ request }) => {
    const financiamento = await chamarApi<Financiamento>(
      request,
      usuarioPrincipal,
      'POST',
      '/financiamentos',
      {
        descricao: 'Amortização fictícia',
        principal: 1000,
        taxaJurosMensal: 1,
        numeroParcelas: 10,
        dataInicio: '2026-10-01',
        contaId: origem.id,
      },
    );
    const amortizado = await chamarApi<{ financiamento: Financiamento }>(
      request,
      usuarioPrincipal,
      'POST',
      `/financiamentos/${financiamento.id}/amortizar`,
      {
        valor: 100,
        dataPagamento: '2026-10-07',
        numeroParcelasRestantes: null,
        modalidade: 'REDUZIR_PRESTACAO',
      },
    );
    expect(amortizado.financiamento.cronogramaVersao).toBeGreaterThan(
      financiamento.cronogramaVersao,
    );
  });
  test('investimento registra aporte, estorno e posição manual datada', async ({ request }) => {
    const investimento = await chamarApi<Investimento>(
      request,
      usuarioPrincipal,
      'POST',
      '/investimentos',
      {
        nome: 'Investimento fictício',
        tipo: 'RENDA_FIXA',
        contaOrigemId: origem.id,
        contaCustodiaId: null,
      },
    );
    const movimento = await chamarApi<MovimentoInvestimento>(
      request,
      usuarioPrincipal,
      'POST',
      '/investimentos/movimentos',
      {
        investimentoId: investimento.id,
        tipo: 'APORTE',
        valor: 50,
        data: '2026-10-07',
      },
    );
    expect(movimento.transacaoId).toBeTruthy();
    await chamarApi(
      request,
      usuarioPrincipal,
      'POST',
      `/investimentos/movimentos/${movimento.id}/estornar`,
      {},
    );
    const posicao = await chamarApi<PosicaoInvestimento>(
      request,
      usuarioPrincipal,
      'POST',
      `/investimentos/${investimento.id}/posicoes`,
      { valor: 0, dataReferencia: '2026-10-07' },
    );
    expect(posicao.valor).toBe(0);
  });
  test('divisão aloca pagamento e reembolso fica ancorado na transação real', async ({
    request,
    page,
  }) => {
    const divisao = await chamarApi<DivisaoCompartilhada>(
      request,
      usuarioPrincipal,
      'POST',
      '/divisoes-compartilhadas',
      {
        nome: 'Divisão fictícia',
        participantes: [
          { usuarioId: usuarioPrincipal.id, percentual: 50 },
          { usuarioId: usuarioParticipante.id, percentual: 50 },
        ],
      },
    );
    const despesa = await chamarApi<Transacao>(request, usuarioPrincipal, 'POST', '/transacoes', {
      tipo: 'SAIDA',
      valor: 100,
      data: '2026-10-07',
      descricao: 'Despesa fictícia compartilhada',
      contaId: origem.id,
      categoriaId: null,
      meioPagamentoId: null,
      itens: [],
    });
    await chamarApi(
      request,
      usuarioPrincipal,
      'POST',
      `/divisoes-compartilhadas/${divisao.id}/transacoes`,
      {
        transacaoId: despesa.id,
        baseCompartilhada: 100,
        responsabilidades: null,
      },
    );
    await chamarApi<Alocacao[]>(
      request,
      usuarioPrincipal,
      'PUT',
      `/divisoes-compartilhadas/${divisao.id}/transacoes/${despesa.id}/alocacoes`,
      { alocacoes: [{ transacaoId: despesa.id, valor: 100 }] },
    );
    const resumo = await chamarApi<ResumoDivisao>(
      request,
      usuarioPrincipal,
      'GET',
      `/divisoes-compartilhadas/${divisao.id}/resumo?inicio=2026-10-01&fim=2026-10-31`,
    );
    expect(
      resumo.participantes.find((participante) => participante.usuarioId === usuarioParticipante.id)
        ?.devido,
    ).toBe(50);
    const conta = await chamarApi<Conta>(request, usuarioParticipante, 'POST', '/contas', {
      nome: 'Reembolso fictício',
      tipo: 'FISICO',
      bancoId: null,
    });
    await chamarApi(
      request,
      usuarioParticipante,
      'POST',
      `/contas/${conta.id}/ajustes-saldo`,
      { saldoInformado: 100, motivo: 'Saldo fictício autorizado' },
      randomUUID(),
    );
    const transacaoReembolso = await chamarApi<Transacao>(
      request,
      usuarioParticipante,
      'POST',
      '/transacoes',
      {
        tipo: 'SAIDA',
        valor: 50,
        data: '2026-10-07',
        descricao: 'Reembolso fictício',
        contaId: conta.id,
        categoriaId: null,
        meioPagamentoId: null,
        itens: [],
      },
    );
    const reembolso = await chamarApi<Reembolso>(
      request,
      usuarioParticipante,
      'POST',
      `/divisoes-compartilhadas/${divisao.id}/reembolsos`,
      { transacaoId: transacaoReembolso.id, recebedorId: usuarioPrincipal.id, valor: 50 },
    );
    expect(reembolso.transacaoId).toBe(transacaoReembolso.id);
    await abrirComSessao(page, usuarioParticipante, '/compartilhamentos');
    await page.getByRole('button', { name: 'Abrir', exact: true }).click();
    await expect(
      page.getByRole('button', { name: 'Atualizar participantes', exact: true }),
    ).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Cancelar vínculo', exact: true })).toHaveCount(
      0,
    );
    await expect(page.getByRole('alert')).toHaveCount(0);
    const negado = await request.delete(
      `${api}/divisoes-compartilhadas/${divisao.id}/reembolsos/${reembolso.id}`,
      { headers: { Authorization: `Bearer ${usuarioParticipante.tokens.accessToken}` } },
    );
    expect(negado.status()).toBe(422);
    await chamarApi(
      request,
      usuarioPrincipal,
      'DELETE',
      `/divisoes-compartilhadas/${divisao.id}/reembolsos/${reembolso.id}`,
    );
  });
  test('alteração real de participantes preserva responsabilidades históricas', async ({
    request,
  }) => {
    const divisao = await chamarApi<DivisaoCompartilhada>(
      request,
      usuarioPrincipal,
      'POST',
      '/divisoes-compartilhadas',
      {
        nome: 'Snapshot fictício',
        participantes: [
          { usuarioId: usuarioPrincipal.id, percentual: 50 },
          { usuarioId: usuarioParticipante.id, percentual: 50 },
        ],
      },
    );
    const despesa = await chamarApi<Transacao>(request, usuarioPrincipal, 'POST', '/transacoes', {
      tipo: 'SAIDA',
      valor: 100,
      data: '2026-10-07',
      descricao: 'Snapshot fictício',
      contaId: origem.id,
      categoriaId: null,
      meioPagamentoId: null,
      itens: [],
    });
    await chamarApi(
      request,
      usuarioPrincipal,
      'POST',
      `/divisoes-compartilhadas/${divisao.id}/transacoes`,
      {
        transacaoId: despesa.id,
        baseCompartilhada: 100,
        responsabilidades: null,
      },
    );
    await chamarApi(
      request,
      usuarioPrincipal,
      'PATCH',
      `/divisoes-compartilhadas/${divisao.id}/participantes`,
      {
        participantes: [
          { usuarioId: usuarioPrincipal.id, percentual: 70 },
          { usuarioId: usuarioParticipante.id, percentual: 30 },
        ],
      },
    );
    const resumo = await chamarApi<ResumoDivisao>(
      request,
      usuarioPrincipal,
      'GET',
      `/divisoes-compartilhadas/${divisao.id}/resumo?inicio=2026-10-01&fim=2026-10-31`,
    );
    expect(
      resumo.participantes.find((participante) => participante.usuarioId === usuarioParticipante.id)
        ?.devido,
    ).toBe(50);
  });
  test('PDF real é lido, revisado e associado sem criar outra transação', async ({ request }) => {
    const transacaoExistente = await chamarApi<Transacao>(
      request,
      usuarioPrincipal,
      'POST',
      '/transacoes',
      {
        tipo: 'SAIDA',
        valor: 10,
        data: '2026-09-01',
        descricao: 'Mercado fictício',
        contaId: origem.id,
        categoriaId: null,
        meioPagamentoId: null,
        itens: [],
      },
    );
    const envio = await request.post(
      `${api}/importacoes-financeiras?bancoId=${bancoId}&tipoDocumento=EXTRATO_CONTA&contaId=${origem.id}`,
      {
        headers: { Authorization: `Bearer ${usuarioPrincipal.tokens.accessToken}` },
        multipart: {
          arquivo: {
            name: 'extrato-ficticio.pdf',
            mimeType: 'application/pdf',
            buffer: pdf(['Extrato', '01/09/2026 Mercado ficticio -R$ 10,00']),
          },
        },
      },
    );
    expect(envio.ok(), `Upload PDF HTTP ${envio.status()}`).toBe(true);
    const revisaoImportacao = (await envio.json()) as RevisaoImportacao;
    expect(revisaoImportacao.importacao.lancamentos.length).toBe(1);
    const lancamento = revisaoImportacao.importacao.lancamentos[0];
    await chamarApi(
      request,
      usuarioPrincipal,
      'PUT',
      `/importacoes-financeiras/${revisaoImportacao.importacao.id}/revisao`,
      {
        contaId: origem.id,
        faturaId: null,
        lancamentos: [
          {
            id: lancamento.id,
            data: transacaoExistente.data,
            descricao: transacaoExistente.descricao,
            valor: transacaoExistente.valor,
            tipo: transacaoExistente.tipo,
            importar: true,
            categoriaId: null,
            itemId: null,
            transacaoId: transacaoExistente.id,
            obrigacaoFinanceiraId: null,
            justificativa: 'Associação explícita de lançamento fictício existente',
          },
        ],
      },
    );
    const importacaoConfirmada = await chamarApi<DocumentoImportacao>(
      request,
      usuarioPrincipal,
      'POST',
      `/importacoes-financeiras/${revisaoImportacao.importacao.id}/confirmar`,
      {},
    );
    expect(importacaoConfirmada.lancamentos[0].estado).toBe('ASSOCIADA');
    expect(importacaoConfirmada.lancamentos[0].transacaoId).toBe(transacaoExistente.id);
  });
});
