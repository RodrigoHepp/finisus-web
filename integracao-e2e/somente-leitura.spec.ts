import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
const api = 'http://localhost:8080/api/v1';
test('OpenAPI real publica os métodos e caminhos do checkout', async ({ request }) => {
  const resposta = await request.get(`${api}/docs`);
  expect(resposta.status()).toBe(200);
  const contratoOpenApi = (await resposta.json()) as {
    paths: Record<string, Record<string, unknown>>;
  };
  const catalogo = JSON.parse(readFileSync('docs/contratos/inventario-http.json', 'utf8')) as {
    operations: { method: string; path: string }[];
  };
  const operacoesPublicadas = Object.entries(contratoOpenApi.paths)
    .flatMap(([caminho, metodos]) =>
      Object.keys(metodos)
        .filter((metodo) => ['get', 'post', 'put', 'patch', 'delete'].includes(metodo))
        .map((metodo) => `${metodo.toUpperCase()} ${caminho}`),
    )
    .sort();
  expect(operacoesPublicadas).toEqual(
    catalogo.operations.map((operacao) => `${operacao.method} ${operacao.path}`).sort(),
  );
});
test('origem real do frontend recebe CORS e 401 legível sem autenticação', async ({ page }) => {
  await page.goto('/entrar');
  await expect(page.getByRole('heading', { name: 'Entre na sua conta' })).toBeVisible();
  const resultado = await page.evaluate(async (url) => {
    const resposta = await fetch(`${url}/usuarios/me`);
    return { status: resposta.status, corpo: (await resposta.json()) as { code?: string } };
  }, api);
  expect(resultado.status).toBe(401);
  expect(typeof resultado.corpo.code).toBe('string');
});
test('guard real mantém recursos protegidos inacessíveis sem sessão', async ({ page }) => {
  await page.goto('/contas');
  await expect(page).toHaveURL(/entrar.*retorno/);
  await expect(page.getByRole('heading', { name: 'Entre na sua conta' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Seu dinheiro em cada conta' })).toHaveCount(0);
});
