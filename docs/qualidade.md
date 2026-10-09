# Qualidade e revisão de pull requests

A CI e a análise Sonar são independentes, seguindo o fluxo utilizado no backend. O GitHub Actions verifica a aplicação Angular; o aplicativo SonarQube Cloud publica a análise estática nas PRs quando a integração externa estiver habilitada.

## CI Angular

O workflow `.github/workflows/ci.yml` roda em pull requests e pushes para `development` e `master`. O check `verify` executa formatação, tipos, lint, testes unitários, build e jornadas Playwright simuladas em desktop, celular e tablet. Utiliza Node 24.18.0 e instala Chromium com as dependências do runner Linux.

As jornadas simuladas não dependem da API real nem de credenciais. Cenários financeiros de integração real permanecem separados e exigem ambiente de teste autorizado.

## SonarQube Cloud

1. Importe `RodrigoHepp/finisus-web` na organização `rodrigohepp`, vinculando o projeto ao repositório GitHub.
2. Configure `development` como branch principal do projeto.
3. Em **Administration → Analysis Method**, habilite **Automatic Analysis**.
4. Confirme que o aplicativo SonarQube Cloud possui acesso ao repositório.
5. Em **Administration → General Settings → Analysis Scope**, exclua o arquivo gerado `src/app/infraestrutura/api/backend.dtos.ts` e confira a classificação dos arquivos `*.spec.ts` como testes.
6. Abra ou atualize uma PR para conferir o check **SonarCloud Code Analysis**.

Esse método não requer `SONAR_TOKEN` ou variables Sonar no workflow. O scanner por CI e seu arquivo `sonar-project.properties` foram retirados para evitar análises concorrentes. A presença dos arquivos de CI no checkout não habilita a integração externa automaticamente.

O Quality Gate é definido no projeto Sonar. Um resultado aprovado significa que seus critérios foram atendidos; não significa ausência de issues. O bloqueio de merge depende também dos checks exigidos nas regras do GitHub.

## Cobertura local

```powershell
npm run test:cobertura
```

O Angular gera `coverage/finisus/lcov.info`, com o provider `@vitest/coverage-v8` compatível com o Vitest instalado. O comando continua útil para diagnóstico local, mas **Automatic Analysis não importa cobertura de testes**. Para enviar cobertura ao Sonar no futuro, será necessário migrar para análise pela CI e desativar a análise automática.

`coverage/`, resultados Playwright e arquivos locais permanecem ignorados pelo Git. Não devem ser adicionados aos commits.

Na validação local de 2026-10-09, passaram 117 testes unitários em 23 arquivos e 51 cenários Playwright simulados. A cobertura local de linhas foi 32,2%; ela não incorpora a execução Playwright nem comprova integração real.

Fonte: [análise automática no SonarQube Cloud](https://docs.sonarsource.com/sonarqube-cloud/analyzing-source-code/automatic-analysis).
