# Finisus Web

Frontend do Finisus, desenvolvido com Angular 22 e Angular Material. Nesta etapa, a aplicação entrega autenticação por JWT, cadastro protegido de usuários, tema claro/escuro e um dashboard estático.

## Escopo atual

- Login com consulta do usuário autenticado em `GET /usuarios/me` após receber os tokens.
- Restauração segura da sessão em `sessionStorage` após recarregar a página.
- Renovação coordenada do access token quando uma requisição protegida retorna `401`.
- Cadastro de usuários em `/usuarios/novo`, acessível somente com sessão autenticada.
- Dashboard de apresentação, sem dados financeiros carregados da API.
- Tema claro/escuro, com preferência salva no navegador.
- Mensagens globais acessíveis e indicadores de processamento reutilizáveis.

## Pré-requisitos

- Node.js 24 ou versão compatível com Angular 22.
- npm 11.
- API do Finisus em execução em `http://localhost:8080`.

## Executar localmente

Instale as dependências e inicie o servidor de desenvolvimento:

```bash
npm install
npm start
```

Abra `http://localhost:4200` no navegador. A URL base da API local está configurada em `src/app/environment/environment.ts` como `http://localhost:8080/api/v1`.

## Scripts

| Comando                | Finalidade                              |
| ---------------------- | --------------------------------------- |
| `npm start`            | Inicia a aplicação em desenvolvimento.  |
| `npm test`             | Executa os testes unitários com Vitest. |
| `npm run lint`         | Analisa o código com ESLint.            |
| `npm run format:check` | Verifica a formatação com Prettier.     |
| `npm run format`       | Formata os arquivos do projeto.         |
| `npm run build`        | Gera a build de produção em `dist/`.    |

## Autenticação

O backend expõe a API em `/api/v1`. O frontend envia JSON para `POST /auth/login`, recebe `accessToken`, `refreshToken` e `expiraEm` e, então, busca o perfil em `GET /usuarios/me` usando `Authorization: Bearer <accessToken>`.

Somente `/auth/login` e `/auth/refresh` são públicos. O endpoint de cadastro permanece protegido e recebe o token Bearer do usuário autenticado. Não há endpoint de logout no contrato atual: encerrar a sessão remove os dados guardados no navegador.

## Organização do código

- `src/app/core`: serviços globais, autenticação, interceptors e processamento de sessão.
- `src/app/shared`: layout e componentes reutilizáveis, como mensagens globais e indicadores de processamento.
- `src/app/features`: páginas de negócio, como autenticação e dashboard.
- `src/app/environment`: configuração da API por ambiente.

Termos técnicos consolidados do Angular e do contrato do backend, como `auth`, `guard`, `interceptor`, `request` e `response`, permanecem em inglês. Nomes do domínio da aplicação usam português.

## Integração contínua

O workflow em `.github/workflows/ci.yml` executa, a cada push e pull request, instalação determinística, verificação de formatação, lint, testes unitários e build.

## Licença e contribuições

O Finisus Web é disponibilizado sob a [GNU Affero General Public License v3.0 ou posterior](LICENSE). Uma licença comercial alternativa poderá ser negociada nos termos de [COMMERCIAL-LICENSE.md](COMMERCIAL-LICENSE.md).

Consulte [CONTRIBUTING.md](CONTRIBUTING.md) antes de abrir uma issue ou pull request. Contribuições aceitas exigem concordância com o [Contributor License Agreement](CLA.md); o texto é um modelo operacional e precisa de revisão jurídica antes de ser usado como contrato definitivo.
