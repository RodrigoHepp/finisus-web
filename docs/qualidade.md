# Análise de qualidade com Sonar

O workflow `.github/workflows/sonar.yml` executa tipos, lint e testes unitários com cobertura antes de enviar a análise ao Sonar. Ele roda em pushes para `development`, pull requests internos com destino a `development` e acionamento manual. PRs de forks e do Dependabot não recebem o token e não executam essa análise.

## Configurar o serviço

1. Crie ou importe `RodrigoHepp/finisus-web` no SonarQube Cloud ou no servidor SonarQube utilizado pela equipe.
2. No serviço, configure `development` como branch principal. No Cloud, desative a análise automática para usar a análise por CI com cobertura.
3. Em GitHub → Settings → Secrets and variables → Actions, configure:

| Tipo     | Nome                 | Valor                                                            |
| -------- | -------------------- | ---------------------------------------------------------------- |
| Secret   | `SONAR_TOKEN`        | Token com permissão de análise para o projeto                    |
| Variable | `SONAR_HOST_URL`     | URL do serviço; no Cloud europeu, `https://sonarcloud.io`        |
| Variable | `SONAR_PROJECT_KEY`  | Chave exata do projeto criado no Sonar                           |
| Variable | `SONAR_ORGANIZATION` | Chave da organização no Cloud; deixe vazia para servidor próprio |

O token fica disponível somente no passo do scanner e nunca deve ser salvo em arquivos do repositório. Ausência de configuração faz o job falhar com uma orientação explícita, sem declarar uma análise bem-sucedida.

O projeto precisa existir no serviço antes da primeira execução. A configuração no checkout não cria o projeto, as variables ou o secret no GitHub. A análise de branches e PRs depende dos recursos habilitados no serviço contratado.

## Cobertura e escopo

```powershell
npm run test:cobertura
```

O Angular gera `coverage/finisus/lcov.info`, que o scanner importa por `sonar.javascript.lcov.reportPaths`. O provider `@vitest/coverage-v8` acompanha a versão do Vitest instalada. Cobertura não é habilitada no comando `npm test` padrão.

O Sonar analisa `src`. Arquivos `*.spec.ts` em `src`, `e2e` e `integracao-e2e` são classificados como testes. O DTO gerado `backend.dtos.ts` é excluído da análise e da cobertura; os demais consumidores e contratos escritos à mão continuam no escopo. O kit local de IA e artefatos gerados ficam fora do escopo de fontes.

`coverage/` e `.scannerwork/` são ignorados pelo Git. Relatórios não devem ser adicionados aos commits.

## Quality Gate e validação

O scanner aguarda o Quality Gate por até 300 segundos e falha se o gate reprovar. As regras e limites são definidos no projeto Sonar; o workflow não reduz limites para fazer a análise passar. Para bloquear merge, configure também o check `Analisar qualidade` nas regras de proteção de `development`, depois de validar a primeira execução remota.

Na validação local de 2026-10-09, passaram 117 testes em 23 arquivos com geração de LCOV. A cobertura de linhas foi 32,2%; isso mede testes unitários, sem incorporar a execução Playwright. Ainda não foi executado scanner autenticado nem validado Quality Gate remoto.

Fontes: [ação oficial do scanner](https://github.com/SonarSource/sonarqube-scan-action) e [cobertura no Angular](https://angular.dev/guide/testing/code-coverage).
