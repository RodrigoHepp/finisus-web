# Integração real — 2026-10-07

## Autenticação administrativa — 2026-10-08

Após reinício informado pelo usuário, OpenAPI publicou142métodos/paths coincidentes com o checkout. Os três testes sem mutação passaram. Antes do reinício a API estava na versão anterior com141operações; essa divergência de ambiente foi superada.

Cadastro agora exige Bearer de usuário com USUARIO_CADASTRAR e desbloqueio exige USUARIO_DESBLOQUEAR. A suíte financeira foi adaptada para cadastrar fixtures somente com administrador de teste recebido por FINISUS_E2E_ADMIN_EMAIL/FINISUS_E2E_ADMIN_PASSWORD. Sem credenciais, os casos financeiros são explicitamente pulados. Credenciais não são salvas em arquivos ou exibidas em relatórios; não há bootstrap de administrador ou SQL executado pelo frontend.

Não foram exercitados cadastro, cinco falhas de senha, bloqueio, refresh bloqueado ou desbloqueio reais nesta etapa. Os117testes unitários/HTTP e51E2E com mocks verificam contratos, permissões da interface, Bearer,403/423e sessão; não certificam execução backend dessas novas regras. A última execução financeira abaixo pertence ao contrato anterior.

## Contrato atual após limpeza — 2026-10-08

Inventário e OpenAPI atual publicam 141 operações, com métodos/paths coincidentes. Três checks reais sem mutação passaram (OpenAPI, CORS/401 e guard). As nove operações legadas não existem; GET/PUT /compartilhamentos/opt-in continuam publicados e são configuração para divisões. A suíte financeira abaixo é histórica e não foi reexecutada nesta adaptação. As correções de persistência/UK informadas pelo usuário não foram homologadas por esses checks.

API em http://localhost:8080/api/v1. O usuário confirmou explicitamente base de teste e autorizou usuários/registros fictícios. Nenhum dado pessoal real foi utilizado. Os usuários fictícios foram inativados ao terminar cada execução; registros e trilhas financeiras permanecem na base de teste conforme contrato de inativação. Nenhuma fonte/configuração do backend foi alterada.

## Resultado

### Nova verificação sem mutação — 2026-10-08

Na refatoração seguinte a API voltou a responder: OpenAPI, CORS/401 e guard passaram (três testes). Nenhuma mutação financeira foi realizada, e os dois HTTP500 históricos continuam sem reteste nesta etapa. Os resultados abaixo preservam a tentativa anterior bloqueada e a última execução financeira.

A correção frontend executou somente o filtro OpenAPI/CORS/guard: guard passou; OpenAPI e CORS/401 falharam por conexão recusada em localhost8080. API indisponível nessa execução, sem iniciar ou alterar backend. A tabela financeira abaixo é a última execução histórica, não um resultado produzido pelas correções atuais. Os HTTP500 de amortização e alteração de participantes não foram reexecutados.

### Última execução financeira — 2026-10-07

A suíte `npm run e2e:integracao` executa chamadas reais e Chromium, sem interceptação/mocks. Última execução: 13 cenários, 11 passaram, 2 falharam. Não foram relaxadas expectativas para aceitar HTTP500. A suíte simulada permanece separada: 77 testes unitários/HTTP e 36 E2E desktop/celular/tablet passaram, assim como tipos, lint, build, estrutura e formatação.

| Cenário real                                    | Resultado | Evidência                                                                                                                                   |
| ----------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| OpenAPI publicado vs checkout                   | passou    | 150 métodos/paths coincidentes                                                                                                              |
| CORS/401 no navegador                           | passou    | localhost4200 autorizado; resposta401 legível                                                                                               |
| Guard sem sessão                                | passou    | rota protegida redireciona ao login                                                                                                         |
| Login, refresh rotativo e acesso entre usuários | passou    | interface autentica; refresh anterior rejeitado; conta alheia inacessível                                                                   |
| Transferência/idem/estorno                      | passou    | interface real; repetição retorna mesmo ID sem duplicar saldo; estorno próprio                                                              |
| Fatura parcial/crédito/estorno                  | passou    | interface paga30 de100; consulta70 em aberto; pagamento adicional90 gera20 de crédito; estorno retorna30 pago                               |
| Obrigação/recorrência                           | passou    | criar/gerar não altera caixa; pagamento com encargos e realização são comandos separados                                                    |
| Pagamento/estorno de parcela                    | passou    | endpoints do financiamento retornam sucesso                                                                                                 |
| Amortização                                     | falhou    | POST /financiamentos/{id}/amortizar retorna500                                                                                              |
| Investimento                                    | passou    | aporte transacional, estorno e posição manual zero/datada                                                                                   |
| Divisão/alocação/reembolso/permissões           | passou    | pagamento real alocado; reembolso ligado a transação; cancelamento pelo participante recusado e pelo criador permitido; UI respeita criador |
| Alteração de participantes/snapshot histórico   | falhou    | PATCH /divisoes-compartilhadas/{id}/participantes retorna500                                                                                |
| PDF real                                        | passou    | PDF textual gerado ficticiamente, leitura/revisão/associação/confirmar; referência à transação existente preservada                         |

Os três cenários de login, transferência e fatura exercitam a interface contra API real; outras operações financeiras nesta suíte são verificações HTTP com DTOs e dados reais de teste. Não há homologação individual de todas150 operações, estados ou concorrência de banco. Estes resultados não certificam produção.

## Bloqueios reproduzidos

1. Amortização: criar financiamento com principal1000, taxa mensal1%,10 parcelas, início2026-10-01 e conta própria; enviar `{valor:100,dataPagamento:"2026-10-07",numeroParcelasRestantes:null,modalidade:"REDUZIR_PRESTACAO"}` ao endpoint de amortização. HTTP500 reproduzido em financiamentos fictícios distintos, inclusive sem pagamento prévio de parcelas.
2. Participantes: criar divisão com dois usuários internos fictícios com opt-in, percentuais50/50 e transação associada; pelo criador enviar percentuais70/30 para os mesmos usuários. HTTP500 reproduzido em divisões distintas. Preservação do snapshot após essa alteração permanece não comprovada em execução.

São falhas confirmadas na execução do backend/ambiente; a causa interna não foi afirmada sem diagnóstico da exceção. Persistência substitui coleções nesses fluxos, mas isso é somente uma hipótese a investigar. Não houve adaptação de payload para contornar regra nem alteração backend. Os testes continuam falhando nesses casos para preservar evidência.

Em 2026-10-08, o usuário informou que os logs mostram violação de chave única (UK), associada à duplicação de registros. Esse diagnóstico foi informado pelo usuário; os logs não foram inspecionados nesta refatoração frontend, e não foi atribuída a mesma causa a ambas as operações sem evidência individual. O backend permanece fora do escopo de edição. Nenhum filtro, retry ou alteração de payload foi introduzido no frontend para mascarar essa falha de persistência.

## Correções frontend obtidas na integração

- Origem de acesso real: usar http://localhost:4200. http://127.0.0.1:4200 recebe403 no preflight CORS desta API; não ampliar CORS backend para acomodar cliente.
- Conta não física exige banco; conta FISICO não aceita banco. Validação e seletor frontend agora seguem Conta.validarBanco, sem alterar contrato HTTP.
- Consulta de identidade real por /usuarios/me na jornada compartilhada. Atualizar participantes, inativar, desassociar, revisar responsabilidades, substituir/cancelar alocações e cancelar reembolso são restritos ao criador. A interface desabilita comandos e evita consulta de pendências reservada ao criador para outros membros. Registro de reembolso continua permitido ao participante conforme domínio.
- Confirmações nativas são aceitas explicitamente pelo teste real. A falha inicial de fatura era do teste, não do pagamento backend.

## Executar

```powershell
npm start
npm run e2e:integracao
```

A suíte financeira cria dados de teste e deve ser executada somente em base autorizada. Para apenas verificações sem mutação: `npm run e2e:integracao -- --grep "OpenAPI|origem real|guard real"`. Credenciais/tokens são efêmeros em memória, não publicados no relatório; traces da suíte real não são habilitados. Fontes em integracao-e2e/ e playwright.integracao.config.ts.
