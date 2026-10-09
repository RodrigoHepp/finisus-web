# Capacidades e limites

Inventário atual do checkout: 26 controllers e 142 operações após remoção do compartilhamento legado e inclusão de desbloqueio administrativo. Consulte [inventário integral](contratos/inventario-completo.md), [matriz](contratos/matriz-integracao.md) e [cobertura da implementação](contratos/cobertura-implementacao.md).

## Confirmado no código backend

- Cadastro exige Bearer e USUARIO_CADASTRAR. Cinco senhas incorretas consecutivas bloqueiam permanentemente o usuário; login correto antes da quinta zera tentativas. Desbloqueio manual exige USUARIO_DESBLOQUEAR e revoga sessões anteriores. A primeira conta administrativa depende de procedimento manual no banco, fora do escopo frontend. Não há senha padrão ou cadastro público.

- Despesas compartilhadas/rateios legados, participantes externos e migração para divisão foram removidos do contrato e do frontend. A jornada usa divisões e pagamentos/alocações ancorados em transações reais.
- Checkout e OpenAPI publicado mantêm GET/PUT de `/compartilhamentos/opt-in`, exigido pelo serviço atual de divisões. Essa configuração é preservada como exceção comprovada à remoção do cliente legado. Não há busca global de usuários nem convite por e-mail; IDs informados são identificações honestas.
- Importações não têm listagem global; a retomada usa ID. PDF deve conter texto legível, até 10 MB; não há OCR. Leitura não cria lançamentos.
- Transferências não têm listagem global: consulta por ID retornado ou conhecido. Estorno usa o agregado.
- Inativação preserva histórico e revoga acesso. Solicitação de anonimização registra pedido; não significa exclusão efetiva.
- Patrimônio informa quando não existe fotografia histórica integral. Investimentos usam posições manuais datadas e movimentos efetivos, sem cotação ou rentabilidade inventadas.

## Validação de ambiente

Na preparação inicial a API estava indisponível. Após o usuário confirmar execução e base de teste, a integração real foi realizada: 11 cenários passaram e 2 falharam com HTTP500 (amortização e alteração de participantes). Consulte [resultado e reproduções](integracao-real.md). Nenhuma fonte backend foi alterada; operações reais utilizaram exclusivamente dados fictícios autorizados.

O volume de operações exige validação operacional com backend de teste e usuários autorizados antes de uso com dados pessoais. As evidências automatizadas são proporcionais aos riscos escolhidos; não há teste E2E individual de cada operação.
