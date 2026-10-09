# Finisus — finanças pessoais

Frontend Angular de finanças pessoais, com componentes standalone, tipagem estrita, Angular Material/CDK e rotas lazy por jornada.

## Executar

Node 24.18.0 (compatível com ^24.15.0) e npm 11.16.0.

```powershell
npm ci
npm start
```

Abra http://localhost:4200. Configure `urlApi` em `src/environment.ts` para o backend de teste, padrão `http://localhost:8080/api/v1`. A origem do frontend precisa estar autorizada pelo CORS backend. A aplicação não usa dados fictícios quando a API falha.

Não há cadastro público. Entre com uma conta existente; usuários com `USUARIO_CADASTRAR` podem cadastrar outras contas em “Usuários e acesso”. `USUARIO_DESBLOQUEAR` permite desbloqueio manual por ID, exigindo novo login do titular. Usuários novos não recebem essas permissões. O primeiro administrador depende da migration V2 e do procedimento manual documentado em `../finisus-backend/docs/autenticacao.md`; não existe senha padrão criada pelo frontend.

## Jornadas

Visão geral e relatórios financeiros; cadastros; contas/reconciliação/ajustes/transferências; transações/itens/correções/histórico; cartões/faturas/compras parceladas; obrigações/recorrências/financiamentos; investimentos/posições; divisões/responsabilidades/alocações/reembolsos; revisão PDF; perfil/privacidade. Despesas/rateios legados e migração foram removidos. A configuração opt-in permanece publicada no contrato atual de divisões.

[Arquitetura e sessão](docs/arquitetura.md), [limites](docs/limites.md), [matriz de contratos](docs/contratos/matriz-integracao.md), [cobertura por operação](docs/contratos/cobertura-implementacao.md).

## Verificar

```powershell
npm run typecheck
npm run lint
npm test
npm run test:cobertura
npm run build
npx playwright install chromium
npm run e2e
npm run format:check
node scripts/gerar-dtos.mjs --check
```

As suítes padrão HTTP e E2E utilizam contratos simulados explícitos; não comprovam integração real nem permissões em produção. Sem backend, login e comandos mostram a falha de conexão.

A análise Sonar e a configuração do Quality Gate estão descritas em [qualidade](docs/qualidade.md). O workflow depende do projeto no serviço e de secret/variables configurados no GitHub.

## Integração com API real

Use http://localhost:4200, origem autorizada pelo CORS da API atual. A suíte financeira `npm run e2e:integracao` cria dados fictícios e requer base de teste autorizada e credenciais administrativas de teste em `FINISUS_E2E_ADMIN_EMAIL`/`FINISUS_E2E_ADMIN_PASSWORD`. Sem essas variáveis, seus cenários financeiros são explicitamente pulados; os testes sem mutação continuam executáveis. Não use contas pessoais nem publique credenciais. O cadastro dos usuários fictícios recebe Bearer do administrador e não concede permissões a eles.

O contrato documentado contém 142 operações. A suíte sem mutação verifica OpenAPI, CORS e guard. Os cenários financeiros e administrativos dependem de ambiente e credenciais de teste autorizados. Veja [relatório](docs/integracao-real.md); essas verificações não homologam os comandos administrativos reais.
