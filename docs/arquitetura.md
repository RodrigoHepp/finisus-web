# Arquitetura do frontend

Angular standalone, TypeScript e templates estritos, OnPush e rotas lazy por jornada. O backend em `../finisus-backend` permaneceu somente leitura.

`infraestrutura/api` define a URL injetável e os DTOs do checkout. `infraestrutura/sessao` coordena autenticação e refresh. `features` organiza tarefas em sessão, relatórios, cadastros/movimentações/contas, crédito/compromissos, investimentos, compartilhamentos, importação e perfil. APIs tipadas ficam separadas das páginas; Signals armazenam estado local e RxJS controla HTTP. `shared` contém apresentação, navegação e formatação. Não existe store financeira global.

O backend calcula saldos, juros, cronogramas, parcelas, responsabilidades, patrimônio e previsões. A apresentação não agrega totais de páginas. Datas civis permanecem strings; os formatadores não as convertem em instantes. Referências ausentes aparecem como não informadas, sem conversão para zero. Contratos usados pelos consumidores são definidos em `infraestrutura/api/contratos-http.ts`, com refinamentos conferidos nos records/mappers backend; o catálogo gerado reexporta aliases para essas mesmas definições. Os demais DTOs gerados preservam nulabilidade conservadora para referências Java. Formulários aplicam validadores de entrada, sem estreitar respostas por conveniência.

## Fronteiras após a revisão

`shared/jornada.ui.ts` concentra estado de carregamento/comando, feedback e confirmação usados por investimentos, compartilhamentos e importação. Seus estilos estão em `shared/jornada.scss`; nenhuma dessas jornadas importa infraestrutura de outra feature.

Compromissos separa a coordenação HTTP em `compromissos.page.ts`, a definição de intenções/valores iniciais/validadores em `formulario-compromisso.ts` e a apresentação standalone OnPush em `campos-compromisso.component.ts/html`. O formulário e a submissão continuam pertencendo à jornada, preservando cancelamento, idempotência e dirty guard. O componente de campos não possui API ou cálculo financeiro.

Divisões mantém comandos e seleção em `divisoes-compartilhadas.page.ts`, enquanto `divisoes-compartilhadas.forms.ts` concentra fábricas tipadas, arrays, validação de entradas e controle de alterações/reset. A extração não cria store global nem transporta a página inteira para uma classe-base. O cliente de despesas/rateios legados, participantes externos e migração foi removido. GET/PUT `/compartilhamentos/opt-in` são configuração ainda publicada para participar de divisões; nenhum outro endpoint do prefixo antigo é consumido.

APIs conservam nomes públicos por aliases de tipos, permitindo evolução incremental dos consumidores. `scripts/gerar-dtos.mjs` mantém o vínculo entre nomes do inventário e contratos canônicos; regenerar o catálogo não reintroduz cópias desses contratos. Payloads, datas, enums, paginação e regras financeiras permanecem os do backend.

## Sessão e API

API configurável em `src/environment.ts`, fornecida por `URL_BASE_API` no bootstrap. Todas as chamadas protegidas usam esse destino. Bearer não é enviado a outros hosts. Somente login e refresh são públicos no interceptor. Cadastro recebe Bearer e exige USUARIO_CADASTRAR, retorna usuário sem substituir a sessão administrativa. Tokens ficam em `sessionStorage` por aba; scripts da mesma origem podem acessá-los, portanto a aplicação não injeta HTML de respostas. Não há suporte inventado a cookies HttpOnly, recuperação de senha ou logout remoto.

A rota lazy /usuarios exige uma das permissões USUARIO_CADASTRAR/USUARIO_DESBLOQUEAR, e cada formulário/handler verifica sua própria permissão. /cadastro redireciona para essa área protegida. O claim permissoes é decodificado defensivamente somente para apresentação, sem validar assinatura nem substituir a autorização backend. Claim ausente/inválido não concede acesso; rotação de token recalcula a navegação. Desbloqueio usa POST por ID, sem corpo e com resposta204, confirmação e orientação de novo login. Não há busca de usuários ou concessão de permissões inventadas.

HTTP403 apresenta falta de permissão sem encerrar a sessão. HTTP423 informa bloqueio sem prazo e necessidade de desbloqueio manual, limpa a sessão correspondente e nunca repete o comando. O navegador não conta falhas, desbloqueia por tempo nem tenta autenticações automáticas. Cinco falhas e reset após login correto são regras do servidor.

Renovação compartilha uma requisição entre consumidores, substitui ambos os tokens e impede restauração após logout. O interceptor renova antes de comandos com access expirado e repete uma consulta GET/HEAD no máximo uma vez após 401. Não repete mutações automaticamente. Falha de renovação limpa sessão e a navegação destrói as jornadas e seus dados. Guards protegem rotas e preservam retorno interno.

Transferência, ajuste e pagamento de fatura retêm a chave de idempotência para a mesma intenção/payload até sucesso. Após resultado desconhecido, a repetição conserva a chave. Mudanças de payload constituem outra intenção. Nenhum retry genérico de comandos financeiros.

## Design e acessibilidade

Identidade com verde profundo, superfícies claras, acento teal, tipografia de sistema e Angular Material/CDK. Navegação por objetivos, painel com legenda financeira, formulários rotulados, estados de carregamento/erro/vazio/sucesso, confirmação e proteção de alterações. Seletores de referência têm páginas reais e registros inativos desabilitados. IDs de usuários e importações são explícitos onde o backend não fornece busca/listagem global. O menu móvel possui foco contido e fechamento por Escape; diálogos usam gestão de foco Material.

## Ferramentas

Node 24.18.0; npm 11.16.0; Angular runtime/compiler 22.2.1; CLI/build 22.2.2; Material/CDK 22.2.2; TypeScript 6.0.2; RxJS 7.8.x. Versões Angular fixadas. Compatibilidade conferida na [tabela oficial](https://angular.dev/reference/versions) e nos peers/engines publicados das versões 22.2. A seleção inicial 22.0 foi substituída após auditoria identificar vulnerabilidades corrigidas na mesma major.

`scripts/angular.mjs` utiliza `NG_BUILD_SASS_EMBEDDED=false`, fallback JavaScript suportado pelo builder. Neste ambiente, o compilador embedded ficou sem resposta; o fallback compilou os mesmos estilos. Não altera bibliotecas instaladas nem relaxa budgets. `typecheck` compila templates com `ngc`; lint cobre TS/templates/acessibilidade; Vitest usa HttpTestingController; Playwright observa jornadas desktop/celular com contratos simulados. Essas evidências não substituem integração real.

## Convenções de nomenclatura

O domínio e as ações próprias usam português: pastas e arquivos em kebab-case, classes em PascalCase e métodos e variáveis em camelCase. Sufixos técnicos como Page, Api, Service, Component, Guard, Request e Input permanecem, como em ContasPage, DiaADiaApi e SessaoService. As pastas features e shared conservam seus termos estruturais; infraestrutura e suas divisões usam português. APIs Angular, RxJS, Material e Playwright, campos HTTP, enums e endpoints publicados mantêm seus nomes originais. Comentários, descrições de testes e mensagens visíveis usam português com acentuação; identificadores não usam acentos.
