# Inventário completo HTTP

Snapshot do checkout em 2026-10-08. CONFIRMED_CODE: 26 controllers, 142 operações HTTP. Extração de código não certifica runtime; nenhuma operação financeira executada.

O [catálogo JSON](inventario-http.json) preserva assinaturas completas, parâmetros/query/defaults, headers, status, 122 records e 26 enums, com fonte e linha. As anotações de validação indicam obrigatoriedade de entrada; ausência de @NotNull em resposta não prova nulabilidade. Não converter opcionais em valores fictícios.

| Método | Endpoint                                                                                      | Ação                         | Destino                            | Classe UI       | Resposta/status                            | Idempotency-Key | Evidência                                      |
| ------ | --------------------------------------------------------------------------------------------- | ---------------------------- | ---------------------------------- | --------------- | ------------------------------------------ | --------------- | ---------------------------------------------- |
| POST   | `/api/v1/usuarios/{usuarioId}/desbloquear`                                                    | desbloquear                  | Administração de usuários          | secundario      | `void` / NO_CONTENT                        | não declarado   | AcessoUsuarioController.java:28                |
| POST   | `/api/v1/auth/cadastro`                                                                       | cadastrar                    | Sessão / Administração de usuários | secundario      | `UsuarioResponse` / CREATED                | não declarado   | AuthController.java:40                         |
| POST   | `/api/v1/auth/login`                                                                          | login                        | Sessão / Administração de usuários | secundario      | `TokenResponse` / OK                       | não declarado   | AuthController.java:49                         |
| POST   | `/api/v1/auth/refresh`                                                                        | refresh                      | Sessão / Administração de usuários | secundario      | `TokenResponse` / OK                       | não declarado   | AuthController.java:54                         |
| GET    | `/api/v1/bancos`                                                                              | listar                       | Cadastros / Bancos                 | principal       | `PaginaResponse<Response>` / OK            | não declarado   | BancoController.java:43                        |
| POST   | `/api/v1/bancos`                                                                              | criar                        | Cadastros / Bancos                 | secundario      | `Response` / CREATED                       | não declarado   | BancoController.java:50                        |
| GET    | `/api/v1/bancos/{bancoId}`                                                                    | buscar                       | Cadastros / Bancos                 | secundario      | `Response` / OK                            | não declarado   | BancoController.java:56                        |
| PATCH  | `/api/v1/bancos/{bancoId}`                                                                    | atualizar                    | Cadastros / Bancos                 | secundario      | `Response` / OK                            | não declarado   | BancoController.java:61                        |
| DELETE | `/api/v1/bancos/{bancoId}`                                                                    | inativar                     | Cadastros / Bancos                 | secundario      | `void` / NO_CONTENT                        | não declarado   | BancoController.java:68                        |
| GET    | `/api/v1/cartoes`                                                                             | listar                       | Cartões                            | principal       | `PaginaResponse<Response>` / OK            | não declarado   | CartaoCreditoController.java:47                |
| POST   | `/api/v1/cartoes`                                                                             | criar                        | Cartões                            | secundario      | `Response` / CREATED                       | não declarado   | CartaoCreditoController.java:55                |
| GET    | `/api/v1/cartoes/{cartaoId}`                                                                  | buscar                       | Cartões                            | secundario      | `Response` / OK                            | não declarado   | CartaoCreditoController.java:62                |
| PATCH  | `/api/v1/cartoes/{cartaoId}`                                                                  | atualizar                    | Cartões                            | secundario      | `Response` / OK                            | não declarado   | CartaoCreditoController.java:67                |
| DELETE | `/api/v1/cartoes/{cartaoId}`                                                                  | inativar                     | Cartões                            | secundario      | `void` / NO_CONTENT                        | não declarado   | CartaoCreditoController.java:74                |
| GET    | `/api/v1/categorias`                                                                          | listar                       | Cadastros / Categorias             | principal       | `PaginaResponse<Response>` / OK            | não declarado   | CategoriaController.java:43                    |
| POST   | `/api/v1/categorias`                                                                          | criar                        | Cadastros / Categorias             | secundario      | `Response` / CREATED                       | não declarado   | CategoriaController.java:50                    |
| GET    | `/api/v1/categorias/{categoriaId}`                                                            | buscar                       | Cadastros / Categorias             | secundario      | `Response` / OK                            | não declarado   | CategoriaController.java:57                    |
| PATCH  | `/api/v1/categorias/{categoriaId}`                                                            | atualizar                    | Cadastros / Categorias             | secundario      | `Response` / OK                            | não declarado   | CategoriaController.java:62                    |
| DELETE | `/api/v1/categorias/{categoriaId}`                                                            | inativar                     | Cadastros / Categorias             | secundario      | `void` / NO_CONTENT                        | não declarado   | CategoriaController.java:69                    |
| GET    | `/api/v1/compras-parceladas`                                                                  | listar                       | Cartões / Compras parceladas       | principal       | `PaginaResponse<Response>` / OK            | não declarado   | CompraParceladaController.java:46              |
| POST   | `/api/v1/compras-parceladas`                                                                  | criar                        | Cartões / Compras parceladas       | secundario      | `Response` / CREATED                       | não declarado   | CompraParceladaController.java:53              |
| GET    | `/api/v1/compras-parceladas/{compraId}`                                                       | buscar                       | Cartões / Compras parceladas       | secundario      | `Response` / OK                            | não declarado   | CompraParceladaController.java:60              |
| POST   | `/api/v1/compras-parceladas/{compraId}/cancelar`                                              | cancelar                     | Cartões / Compras parceladas       | secundario      | `Response` / OK                            | não declarado   | CompraParceladaController.java:65              |
| GET    | `/api/v1/compartilhamentos/opt-in`                                                            | consultar                    | Perfil / Compartilhamento          | principal       | `ConfigResponse` / OK                      | não declarado   | ConfiguracaoCompartilhamentoController.java:25 |
| PUT    | `/api/v1/compartilhamentos/opt-in`                                                            | atualizar                    | Perfil / Compartilhamento          | secundario      | `ConfigResponse` / OK                      | não declarado   | ConfiguracaoCompartilhamentoController.java:30 |
| GET    | `/api/v1/contas`                                                                              | listar                       | Contas                             | principal       | `PaginaResponse<Response>` / OK            | não declarado   | ContaController.java:56                        |
| POST   | `/api/v1/contas`                                                                              | criar                        | Contas                             | secundario      | `Response` / CREATED                       | não declarado   | ContaController.java:63                        |
| GET    | `/api/v1/contas/{contaId}`                                                                    | buscar                       | Contas                             | secundario      | `Response` / OK                            | não declarado   | ContaController.java:70                        |
| GET    | `/api/v1/contas/{contaId}/reconciliacao`                                                      | reconciliar                  | Contas                             | secundario      | `ReconciliacaoResponse` / OK               | não declarado   | ContaController.java:75                        |
| POST   | `/api/v1/contas/{contaId}/ajustes-saldo`                                                      | ajustarSaldo                 | Contas                             | secundario      | `AjusteSaldoResponse` / CREATED            | obrigatório     | ContaController.java:80                        |
| GET    | `/api/v1/contas/{contaId}/ajustes-saldo`                                                      | listarAjustesSaldo           | Contas                             | secundario      | `PaginaResponse<AjusteSaldoResponse>` / OK | não declarado   | ContaController.java:90                        |
| PATCH  | `/api/v1/contas/{contaId}`                                                                    | atualizar                    | Contas                             | secundario      | `Response` / OK                            | não declarado   | ContaController.java:99                        |
| DELETE | `/api/v1/contas/{contaId}`                                                                    | inativar                     | Contas                             | secundario      | `void` / NO_CONTENT                        | não declarado   | ContaController.java:106                       |
| GET    | `/api/v1/dashboard/mensal`                                                                    | consultarMensal              | Relatórios                         | principal       | `MensalResponse` / OK                      | não declarado   | DashboardFinanceiroController.java:34          |
| GET    | `/api/v1/dashboard/resumo`                                                                    | consultarResumoPeriodo       | Relatórios                         | principal       | `ResumoPeriodoResponse` / OK               | não declarado   | DashboardFinanceiroController.java:40          |
| GET    | `/api/v1/dashboard/anual`                                                                     | consultarAnual               | Relatórios                         | principal       | `ResumoAnualResponse` / OK                 | não declarado   | DashboardFinanceiroController.java:47          |
| GET    | `/api/v1/dashboard/anual/composicao`                                                          | consultarComposicaoAnual     | Relatórios                         | principal       | `ComposicaoAnualResponse` / OK             | não declarado   | DashboardFinanceiroController.java:53          |
| GET    | `/api/v1/dashboard/balancete`                                                                 | consultarBalancete           | Relatórios                         | principal       | `BalanceteResponse` / OK                   | não declarado   | DashboardFinanceiroController.java:59          |
| GET    | `/api/v1/dashboard/balancete/anual`                                                           | consultarBalanceteAnual      | Relatórios                         | principal       | `BalanceteResponse` / OK                   | não declarado   | DashboardFinanceiroController.java:72          |
| GET    | `/api/v1/divisoes-compartilhadas`                                                             | listar                       | Divisões compartilhadas            | principal       | `PaginaResponse<DivisaoResponse>` / OK     | não declarado   | DivisaoCompartilhadaController.java:62         |
| POST   | `/api/v1/divisoes-compartilhadas`                                                             | criar                        | Divisões compartilhadas            | secundario      | `DivisaoResponse` / CREATED                | não declarado   | DivisaoCompartilhadaController.java:69         |
| GET    | `/api/v1/divisoes-compartilhadas/{divisaoId}`                                                 | buscar                       | Divisões compartilhadas            | secundario      | `DivisaoResponse` / OK                     | não declarado   | DivisaoCompartilhadaController.java:76         |
| GET    | `/api/v1/divisoes-compartilhadas/{divisaoId}/participantes/historico`                         | listarHistoricoParticipantes | Divisões compartilhadas            | secundario      | `List<HistoricoParticipanteResponse>` / OK | não declarado   | DivisaoCompartilhadaController.java:81         |
| PATCH  | `/api/v1/divisoes-compartilhadas/{divisaoId}/participantes`                                   | atualizarParticipantes       | Divisões compartilhadas            | secundario      | `DivisaoResponse` / OK                     | não declarado   | DivisaoCompartilhadaController.java:90         |
| DELETE | `/api/v1/divisoes-compartilhadas/{divisaoId}`                                                 | inativar                     | Divisões compartilhadas            | secundario      | `void` / NO_CONTENT                        | não declarado   | DivisaoCompartilhadaController.java:97         |
| POST   | `/api/v1/divisoes-compartilhadas/{divisaoId}/transacoes`                                      | associar                     | Divisões compartilhadas            | secundario      | `void` / NO_CONTENT                        | não declarado   | DivisaoCompartilhadaController.java:103        |
| DELETE | `/api/v1/divisoes-compartilhadas/{divisaoId}/transacoes/{transacaoId}`                        | desassociar                  | Divisões compartilhadas            | secundario      | `void` / NO_CONTENT                        | não declarado   | DivisaoCompartilhadaController.java:114        |
| GET    | `/api/v1/divisoes-compartilhadas/{divisaoId}/transacoes/{transacaoId}/alocacoes`              | listarAlocacoes              | Divisões compartilhadas            | secundario      | `List<AlocacaoPagamentoResponse>` / OK     | não declarado   | DivisaoCompartilhadaController.java:121        |
| PUT    | `/api/v1/divisoes-compartilhadas/{divisaoId}/transacoes/{transacaoId}/alocacoes`              | substituirAlocacoes          | Divisões compartilhadas            | secundario      | `List<AlocacaoPagamentoResponse>` / OK     | não declarado   | DivisaoCompartilhadaController.java:130        |
| DELETE | `/api/v1/divisoes-compartilhadas/{divisaoId}/transacoes/{transacaoId}/alocacoes/{alocacaoId}` | cancelarAlocacao             | Divisões compartilhadas            | secundario      | `void` / NO_CONTENT                        | não declarado   | DivisaoCompartilhadaController.java:141        |
| POST   | `/api/v1/divisoes-compartilhadas/{divisaoId}/reembolsos`                                      | registrarReembolso           | Divisões compartilhadas            | secundario      | `ReembolsoResponse` / CREATED              | não declarado   | DivisaoCompartilhadaController.java:148        |
| GET    | `/api/v1/divisoes-compartilhadas/{divisaoId}/reembolsos`                                      | listarReembolsos             | Divisões compartilhadas            | secundario      | `List<ReembolsoResponse>` / OK             | não declarado   | DivisaoCompartilhadaController.java:156        |
| DELETE | `/api/v1/divisoes-compartilhadas/{divisaoId}/reembolsos/{reembolsoId}`                        | cancelarReembolso            | Divisões compartilhadas            | secundario      | `void` / NO_CONTENT                        | não declarado   | DivisaoCompartilhadaController.java:162        |
| GET    | `/api/v1/divisoes-compartilhadas/{divisaoId}/transacoes/{transacaoId}/pagamento`              | consultarPagamento           | Divisões compartilhadas            | secundario      | `ResumoPagamentoResponse` / OK             | não declarado   | DivisaoCompartilhadaController.java:169        |
| GET    | `/api/v1/divisoes-compartilhadas/{divisaoId}/transacoes/pendentes-revisao`                    | listarPendentes              | Divisões compartilhadas            | secundario      | `List<VinculoPendenteResponse>` / OK       | não declarado   | DivisaoCompartilhadaController.java:179        |
| PUT    | `/api/v1/divisoes-compartilhadas/{divisaoId}/transacoes/{transacaoId}/responsabilidades`      | revisar                      | Divisões compartilhadas            | secundario      | `void` / NO_CONTENT                        | não declarado   | DivisaoCompartilhadaController.java:185        |
| GET    | `/api/v1/divisoes-compartilhadas/{divisaoId}/resumo`                                          | resumo                       | Divisões compartilhadas            | secundario      | `ResumoResponse` / OK                      | não declarado   | DivisaoCompartilhadaController.java:194        |
| GET    | `/api/v1/cartoes/{cartaoId}/faturas`                                                          | listar                       | Cartões / Faturas                  | secundario      | `PaginaResponse<Response>` / OK            | não declarado   | FaturaController.java:52                       |
| POST   | `/api/v1/cartoes/faturas`                                                                     | criar                        | Cartões / Faturas                  | secundario      | `Response` / CREATED                       | não declarado   | FaturaController.java:60                       |
| GET    | `/api/v1/cartoes/faturas/{faturaId}`                                                          | buscar                       | Cartões / Faturas                  | secundario      | `DetalheResponse` / OK                     | não declarado   | FaturaController.java:67                       |
| POST   | `/api/v1/cartoes/faturas/{faturaId}/gastos`                                                   | gasto                        | Cartões / Faturas                  | secundario      | `TransacaoResponse` / CREATED              | não declarado   | FaturaController.java:72                       |
| POST   | `/api/v1/cartoes/faturas/{faturaId}/fechar`                                                   | fechar                       | Cartões / Faturas                  | secundario      | `Response` / OK                            | não declarado   | FaturaController.java:84                       |
| POST   | `/api/v1/cartoes/faturas/processar-ciclos`                                                    | processarCiclos              | Cartões / Faturas                  | secundario      | `CicloResponse` / OK                       | não declarado   | FaturaController.java:89                       |
| POST   | `/api/v1/cartoes/faturas/{faturaId}/pagar`                                                    | pagar                        | Cartões / Faturas                  | secundario      | `Response` / OK                            | obrigatório     | FaturaController.java:94                       |
| POST   | `/api/v1/cartoes/faturas/{faturaId}/estornar-pagamento`                                       | estornarPagamento            | Cartões / Faturas                  | secundario      | `Response` / OK                            | não declarado   | FaturaController.java:102                      |
| PATCH  | `/api/v1/cartoes/faturas/{faturaId}`                                                          | atualizar                    | Cartões / Faturas                  | secundario      | `Response` / OK                            | não declarado   | FaturaController.java:107                      |
| POST   | `/api/v1/cartoes/faturas/{faturaId}/cancelar`                                                 | cancelar                     | Cartões / Faturas                  | secundario      | `Response` / OK                            | não declarado   | FaturaController.java:114                      |
| GET    | `/api/v1/financiamentos`                                                                      | listar                       | Financiamentos                     | principal       | `PaginaResponse<Response>` / OK            | não declarado   | FinanciamentoController.java:45                |
| GET    | `/api/v1/financiamentos/{financiamentoId}`                                                    | buscar                       | Financiamentos                     | secundario      | `Response` / OK                            | não declarado   | FinanciamentoController.java:52                |
| GET    | `/api/v1/financiamentos/{financiamentoId}/cronogramas/{versao}`                               | consultarCronogramaHistorico | Financiamentos                     | secundario      | `List<ParcelaHistoricaResponse>` / OK      | não declarado   | FinanciamentoController.java:57                |
| POST   | `/api/v1/financiamentos`                                                                      | criar                        | Financiamentos                     | secundario      | `Response` / CREATED                       | não declarado   | FinanciamentoController.java:64                |
| POST   | `/api/v1/financiamentos/{financiamentoId}/cancelar`                                           | cancelar                     | Financiamentos                     | secundario      | `Response` / OK                            | não declarado   | FinanciamentoController.java:72                |
| POST   | `/api/v1/financiamentos/{financiamentoId}/refinanciar`                                        | refinanciar                  | Financiamentos                     | secundario      | `RefinanciamentoResponse` / CREATED        | não declarado   | FinanciamentoController.java:77                |
| POST   | `/api/v1/financiamentos/{financiamentoId}/amortizar`                                          | amortizar                    | Financiamentos                     | secundario      | `AmortizacaoResponse` / OK                 | não declarado   | FinanciamentoController.java:90                |
| POST   | `/api/v1/importacoes-financeiras`                                                             | iniciar                      | Importações                        | secundario      | `RevisaoResponse` / CREATED                | não declarado   | ImportacaoFinanceiraController.java:48         |
| GET    | `/api/v1/importacoes-financeiras/{importacaoId}`                                              | buscar                       | Importações                        | secundario      | `RevisaoResponse` / OK                     | não declarado   | ImportacaoFinanceiraController.java:64         |
| PUT    | `/api/v1/importacoes-financeiras/{importacaoId}/revisao`                                      | revisar                      | Importações                        | secundario      | `RevisaoResponse` / OK                     | não declarado   | ImportacaoFinanceiraController.java:69         |
| POST   | `/api/v1/importacoes-financeiras/{importacaoId}/confirmar`                                    | confirmar                    | Importações                        | secundario      | `ImportacaoResponse` / OK                  | não declarado   | ImportacaoFinanceiraController.java:77         |
| GET    | `/api/v1/investimentos`                                                                       | listar                       | Investimentos                      | principal       | `PaginaResponse<Response>` / OK            | não declarado   | InvestimentoController.java:45                 |
| POST   | `/api/v1/investimentos`                                                                       | criar                        | Investimentos                      | secundario      | `Response` / CREATED                       | não declarado   | InvestimentoController.java:52                 |
| GET    | `/api/v1/investimentos/{investimentoId}`                                                      | buscar                       | Investimentos                      | secundario      | `Response` / OK                            | não declarado   | InvestimentoController.java:60                 |
| PATCH  | `/api/v1/investimentos/{investimentoId}`                                                      | atualizar                    | Investimentos                      | secundario      | `Response` / OK                            | não declarado   | InvestimentoController.java:65                 |
| DELETE | `/api/v1/investimentos/{investimentoId}`                                                      | inativar                     | Investimentos                      | secundario      | `void` / NO_CONTENT                        | não declarado   | InvestimentoController.java:73                 |
| GET    | `/api/v1/itens`                                                                               | listar                       | Cadastros / Itens                  | principal       | `PaginaResponse<Response>` / OK            | não declarado   | ItemController.java:41                         |
| POST   | `/api/v1/itens`                                                                               | criar                        | Cadastros / Itens                  | secundario      | `Response` / CREATED                       | não declarado   | ItemController.java:48                         |
| GET    | `/api/v1/itens/{itemId}`                                                                      | buscar                       | Cadastros / Itens                  | secundario      | `Response` / OK                            | não declarado   | ItemController.java:54                         |
| PATCH  | `/api/v1/itens/{itemId}`                                                                      | atualizar                    | Cadastros / Itens                  | secundario      | `Response` / OK                            | não declarado   | ItemController.java:59                         |
| DELETE | `/api/v1/itens/{itemId}`                                                                      | inativar                     | Cadastros / Itens                  | secundario      | `void` / NO_CONTENT                        | não declarado   | ItemController.java:65                         |
| GET    | `/api/v1/meios-pagamento`                                                                     | listar                       | Cadastros / Meios de pagamento     | principal       | `PaginaResponse<Response>` / OK            | não declarado   | MeioPagamentoController.java:43                |
| POST   | `/api/v1/meios-pagamento`                                                                     | criar                        | Cadastros / Meios de pagamento     | secundario      | `Response` / CREATED                       | não declarado   | MeioPagamentoController.java:50                |
| GET    | `/api/v1/meios-pagamento/{meioPagamentoId}`                                                   | buscar                       | Cadastros / Meios de pagamento     | secundario      | `Response` / OK                            | não declarado   | MeioPagamentoController.java:56                |
| PATCH  | `/api/v1/meios-pagamento/{meioPagamentoId}`                                                   | atualizar                    | Cadastros / Meios de pagamento     | secundario      | `Response` / OK                            | não declarado   | MeioPagamentoController.java:61                |
| DELETE | `/api/v1/meios-pagamento/{meioPagamentoId}`                                                   | inativar                     | Cadastros / Meios de pagamento     | secundario      | `void` / NO_CONTENT                        | não declarado   | MeioPagamentoController.java:68                |
| GET    | `/api/v1/investimentos/{investimentoId}/movimentos`                                           | listar                       | Investimentos / Movimentos         | secundario      | `PaginaResponse<Response>` / OK            | não declarado   | MovimentoInvestimentoController.java:45        |
| POST   | `/api/v1/investimentos/movimentos`                                                            | movimentar                   | Investimentos / Movimentos         | secundario      | `Response` / CREATED                       | não declarado   | MovimentoInvestimentoController.java:53        |
| POST   | `/api/v1/investimentos/movimentos/{movimentoId}/estornar`                                     | estornar                     | Investimentos / Movimentos         | secundario      | `Response` / OK                            | não declarado   | MovimentoInvestimentoController.java:60        |
| GET    | `/api/v1/obrigacoes-financeiras`                                                              | listar                       | Obrigações                         | principal       | `PaginaResponse<Response>` / OK            | não declarado   | ObrigacaoFinanceiraController.java:43          |
| POST   | `/api/v1/obrigacoes-financeiras`                                                              | criar                        | Obrigações                         | secundario      | `Response` / CREATED                       | não declarado   | ObrigacaoFinanceiraController.java:53          |
| GET    | `/api/v1/obrigacoes-financeiras/{obrigacaoId}`                                                | buscar                       | Obrigações                         | secundario      | `Response` / OK                            | não declarado   | ObrigacaoFinanceiraController.java:61          |
| POST   | `/api/v1/obrigacoes-financeiras/{obrigacaoId}/pagar`                                          | pagar                        | Obrigações                         | secundario      | `Response` / OK                            | não declarado   | ObrigacaoFinanceiraController.java:66          |
| GET    | `/api/v1/obrigacoes-financeiras/{obrigacaoId}/pagamentos`                                     | listarPagamentos             | Obrigações                         | secundario      | `java.util.List<PagamentoResponse>` / OK   | não declarado   | ObrigacaoFinanceiraController.java:73          |
| POST   | `/api/v1/obrigacoes-financeiras/{obrigacaoId}/pagamentos/{pagamentoId}/estornar`              | estornarPagamento            | Obrigações                         | secundario      | `Response` / OK                            | não declarado   | ObrigacaoFinanceiraController.java:79          |
| POST   | `/api/v1/obrigacoes-financeiras/{obrigacaoId}/estornar-pagamento`                             | estornarPagamento            | Obrigações                         | compatibilidade | `Response` / OK                            | não declarado   | ObrigacaoFinanceiraController.java:85          |
| POST   | `/api/v1/obrigacoes-financeiras/{obrigacaoId}/cancelar`                                       | cancelar                     | Obrigações                         | secundario      | `Response` / OK                            | não declarado   | ObrigacaoFinanceiraController.java:90          |
| GET    | `/api/v1/dashboard/visao-geral`                                                               | visaoGeral                   | Visão geral e análises             | principal       | `VisaoGeralResponse` / OK                  | não declarado   | PainelFinanceiroController.java:32             |
| GET    | `/api/v1/dashboard/agenda`                                                                    | agenda                       | Visão geral e análises             | principal       | `AgendaResponse` / OK                      | não declarado   | PainelFinanceiroController.java:38             |
| GET    | `/api/v1/dashboard/patrimonio`                                                                | patrimonio                   | Visão geral e análises             | principal       | `PatrimonioResponse` / OK                  | não declarado   | PainelFinanceiroController.java:44             |
| GET    | `/api/v1/dashboard/compartilhados`                                                            | compartilhados               | Visão geral e análises             | principal       | `CompartilhadosResponse` / OK              | não declarado   | PainelFinanceiroController.java:49             |
| GET    | `/api/v1/dashboard/receitas-gastos`                                                           | receitasEGastos              | Visão geral e análises             | principal       | `AnaliseReceitasGastosResponse` / OK       | não declarado   | PainelFinanceiroController.java:55             |
| GET    | `/api/v1/financiamentos/{financiamentoId}/parcelas`                                           | listar                       | Financiamentos / Parcelas          | secundario      | `PaginaResponse<Response>` / OK            | não declarado   | ParcelaFinanciamentoController.java:46         |
| POST   | `/api/v1/financiamentos/{financiamentoId}/parcelas/{parcelaId}/pagar`                         | pagar                        | Financiamentos / Parcelas          | secundario      | `Response` / OK                            | não declarado   | ParcelaFinanciamentoController.java:54         |
| POST   | `/api/v1/financiamentos/{financiamentoId}/parcelas/{parcelaId}/estornar-pagamento`            | estornarPagamento            | Financiamentos / Parcelas          | secundario      | `Response` / OK                            | não declarado   | ParcelaFinanciamentoController.java:60         |
| POST   | `/api/v1/financiamentos/{financiamentoId}/parcelas/{parcelaId}/refinanciamento`               | refinanciar                  | Financiamentos / Parcelas          | secundario      | `RefinanciamentoResponse` / OK             | não declarado   | ParcelaFinanciamentoController.java:66         |
| DELETE | `/api/v1/financiamentos/{financiamentoId}/parcelas/{parcelaId}/erro-de-lancamento`            | excluirPorErroDeLancamento   | Financiamentos / Parcelas          | secundario      | `List<Response>` / OK                      | não declarado   | ParcelaFinanciamentoController.java:73         |
| GET    | `/api/v1/usuarios/me`                                                                         | consultar                    | Perfil e privacidade               | principal       | `Response` / OK                            | não declarado   | PerfilUsuarioController.java:42                |
| PATCH  | `/api/v1/usuarios/me`                                                                         | atualizar                    | Perfil e privacidade               | secundario      | `Response` / OK                            | não declarado   | PerfilUsuarioController.java:47                |
| DELETE | `/api/v1/usuarios/me`                                                                         | desativar                    | Perfil e privacidade               | secundario      | `void` / NO_CONTENT                        | não declarado   | PerfilUsuarioController.java:53                |
| GET    | `/api/v1/usuarios/me/dados`                                                                   | exportarDados                | Perfil e privacidade               | principal       | `ExportacaoResponse` / OK                  | não declarado   | PerfilUsuarioController.java:62                |
| POST   | `/api/v1/usuarios/me/solicitacoes-anonimizacao`                                               | solicitarAnonimizacao        | Perfil e privacidade               | secundario      | `SolicitacaoResponse` / CREATED            | não declarado   | PerfilUsuarioController.java:69                |
| GET    | `/api/v1/usuarios/me/solicitacoes-privacidade`                                                | listarSolicitacoes           | Perfil e privacidade               | principal       | `List<SolicitacaoResponse>` / OK           | não declarado   | PerfilUsuarioController.java:76                |
| GET    | `/api/v1/investimentos/{investimentoId}/posicoes`                                             | listar                       | Investimentos / Posições           | secundario      | `PaginaResponse<Response>` / OK            | não declarado   | PosicaoInvestimentoController.java:40          |
| POST   | `/api/v1/investimentos/{investimentoId}/posicoes`                                             | registrar                    | Investimentos / Posições           | secundario      | `Response` / CREATED                       | não declarado   | PosicaoInvestimentoController.java:48          |
| POST   | `/api/v1/previsoes/recalcular`                                                                | recalcular                   | Previsões                          | secundario      | `List<Response>` / OK                      | não declarado   | PrevisaoFluxoCaixaController.java:38           |
| GET    | `/api/v1/previsoes/{anoMes}`                                                                  | consultar                    | Previsões                          | secundario      | `PaginaResponse<Response>` / OK            | não declarado   | PrevisaoFluxoCaixaController.java:44           |
| GET    | `/api/v1/recorrencias`                                                                        | listar                       | Agenda / Recorrências              | principal       | `PaginaResponse<Response>` / OK            | não declarado   | RecorrenciaController.java:53                  |
| POST   | `/api/v1/recorrencias`                                                                        | criar                        | Agenda / Recorrências              | secundario      | `Response` / CREATED                       | não declarado   | RecorrenciaController.java:60                  |
| GET    | `/api/v1/recorrencias/{recorrenciaId}`                                                        | buscar                       | Agenda / Recorrências              | secundario      | `Response` / OK                            | não declarado   | RecorrenciaController.java:67                  |
| PATCH  | `/api/v1/recorrencias/{recorrenciaId}`                                                        | atualizar                    | Agenda / Recorrências              | secundario      | `Response` / OK                            | não declarado   | RecorrenciaController.java:72                  |
| DELETE | `/api/v1/recorrencias/{recorrenciaId}`                                                        | inativar                     | Agenda / Recorrências              | secundario      | `void` / NO_CONTENT                        | não declarado   | RecorrenciaController.java:79                  |
| POST   | `/api/v1/recorrencias/geracoes/{anoMes}`                                                      | gerar                        | Agenda / Recorrências              | secundario      | `List<OcorrenciaResponse>` / OK            | não declarado   | RecorrenciaController.java:85                  |
| GET    | `/api/v1/recorrencias/ocorrencias/{anoMes}`                                                   | listarOcorrencias            | Agenda / Recorrências              | secundario      | `List<OcorrenciaResponse>` / OK            | não declarado   | RecorrenciaController.java:91                  |
| POST   | `/api/v1/recorrencias/ocorrencias/{ocorrenciaId}/realizar`                                    | realizar                     | Agenda / Recorrências              | secundario      | `OcorrenciaResponse` / OK                  | não declarado   | RecorrenciaController.java:97                  |
| GET    | `/api/v1/transacoes`                                                                          | listar                       | Lançamentos                        | principal       | `PaginaResponse<TransacaoResponse>` / OK   | não declarado   | TransacaoController.java:59                    |
| POST   | `/api/v1/transacoes`                                                                          | registrar                    | Lançamentos                        | secundario      | `TransacaoResponse` / CREATED              | não declarado   | TransacaoController.java:79                    |
| GET    | `/api/v1/transacoes/{transacaoId}`                                                            | buscar                       | Lançamentos                        | secundario      | `TransacaoResponse` / OK                   | não declarado   | TransacaoController.java:85                    |
| PATCH  | `/api/v1/transacoes/{transacaoId}`                                                            | corrigir                     | Lançamentos                        | secundario      | `TransacaoResponse` / OK                   | não declarado   | TransacaoController.java:90                    |
| PUT    | `/api/v1/transacoes/{transacaoId}/itens`                                                      | detalhar                     | Lançamentos                        | secundario      | `TransacaoResponse` / OK                   | não declarado   | TransacaoController.java:97                    |
| POST   | `/api/v1/transacoes/{transacaoId}/estorno`                                                    | estornar                     | Lançamentos                        | secundario      | `TransacaoResponse` / OK                   | não declarado   | TransacaoController.java:106                   |
| GET    | `/api/v1/transacoes/{transacaoId}/historico`                                                  | historico                    | Lançamentos                        | secundario      | `PaginaResponse<HistoricoResponse>` / OK   | não declarado   | TransacaoController.java:111                   |
| POST   | `/api/v1/transferencias`                                                                      | transferir                   | Contas / Transferências            | secundario      | `Response` / CREATED                       | obrigatório     | TransferenciaContaController.java:44           |
| GET    | `/api/v1/transferencias/{transferenciaId}`                                                    | buscar                       | Contas / Transferências            | secundario      | `Response` / OK                            | não declarado   | TransferenciaContaController.java:54           |
| POST   | `/api/v1/transferencias/{transferenciaId}/estornar`                                           | estornar                     | Contas / Transferências            | secundario      | `Response` / OK                            | não declarado   | TransferenciaContaController.java:59           |

## Schemas HTTP

Tipos Java preservados para revisão. BigDecimal é número JSON; LocalDate é data ISO; Instant é timestamp ISO; LocalDateTime não declara fuso. Enums permanecem exatamente como no servidor. Referências opcionais devem manter null e listas manter seu conteúdo.

### AuthController.CadastroRequest

Fonte: `src/main/java/com/finisus/adapters/in/web/AuthController.java:64`

```java
@NotBlank @Size(max = 150) String nome,
@NotBlank @Email String email,
@NotBlank @Size(min = 8, max = 128) String senha
```

### AuthController.LoginRequest

Fonte: `src/main/java/com/finisus/adapters/in/web/AuthController.java:68`

```java
@NotBlank @Email String email,
@NotBlank String senha
```

### AuthController.RefreshRequest

Fonte: `src/main/java/com/finisus/adapters/in/web/AuthController.java:71`

```java
@NotBlank String refreshToken
```

### AuthController.UsuarioResponse

Fonte: `src/main/java/com/finisus/adapters/in/web/AuthController.java:74`

```java
Long id,
String nome,
String email
```

### AuthController.TokenResponse

Fonte: `src/main/java/com/finisus/adapters/in/web/AuthController.java:77`

```java
String accessToken,
String refreshToken,
Instant expiraEm
```

### BancoController.Request

Fonte: `src/main/java/com/finisus/adapters/in/web/BancoController.java:74`

```java
@NotBlank @Size(max = 150) String nome,
@NotBlank @Size(max = 20) String codigo
```

### BancoController.Response

Fonte: `src/main/java/com/finisus/adapters/in/web/BancoController.java:77`

```java
Long id,
String nome,
String codigo,
boolean sistema
```

### CartaoCreditoController.Request

Fonte: `src/main/java/com/finisus/adapters/in/web/CartaoCreditoController.java:80`

```java
@NotBlank @Size(max = 100) String nome,
@NotNull @DecimalMin("0.01") BigDecimal limite,
@Min(1) @Max(31) int diaFechamento,
@Min(1) @Max(31) int diaVencimento
```

### CartaoCreditoController.Response

Fonte: `src/main/java/com/finisus/adapters/in/web/CartaoCreditoController.java:84`

```java
Long id,
String nome,
BigDecimal limite,
int diaFechamento,
int diaVencimento,
boolean ativo
```

### CategoriaController.Request

Fonte: `src/main/java/com/finisus/adapters/in/web/CategoriaController.java:75`

```java
@NotBlank @Size(max = 100) String nome,
@Positive Long categoriaPaiId
```

### CategoriaController.Response

Fonte: `src/main/java/com/finisus/adapters/in/web/CategoriaController.java:78`

```java
Long id,
String nome,
Long categoriaPaiId,
boolean ativo
```

### CompraParceladaController.Request

Fonte: `src/main/java/com/finisus/adapters/in/web/CompraParceladaController.java:70`

```java
@NotBlank @Size(max = 300) String descricao,
@NotNull @DecimalMin("0.01") BigDecimal valorTotal,
@Min(1) int numeroParcelas,
@NotNull LocalDate dataCompra,
@Positive Long categoriaId,
@NotNull @Positive Long contaId,
@Positive Long cartaoId
```

### CompraParceladaController.Response

Fonte: `src/main/java/com/finisus/adapters/in/web/CompraParceladaController.java:75`

```java
Long id,
String descricao,
BigDecimal valorTotal,
int numeroParcelas,
LocalDate dataCompra,
Long categoriaId,
Long contaId,
Long cartaoId,
java.time.LocalDateTime canceladaEm
```

### ConfiguracaoCompartilhamentoController.OptInRequest

Fonte: `src/main/java/com/finisus/adapters/in/web/ConfiguracaoCompartilhamentoController.java:35`

```java
boolean aceita
```

### ConfiguracaoCompartilhamentoController.ConfigResponse

Fonte: `src/main/java/com/finisus/adapters/in/web/ConfiguracaoCompartilhamentoController.java:38`

```java
boolean aceita
```

### ContaController.Request

Fonte: `src/main/java/com/finisus/adapters/in/web/ContaController.java:112`

```java
@NotBlank @Size(max = 150) String nome,
@NotNull TipoConta tipo,
@Positive Long bancoId
```

### ContaController.Response

Fonte: `src/main/java/com/finisus/adapters/in/web/ContaController.java:115`

```java
Long id,
String nome,
TipoConta tipo,
Long bancoId,
BigDecimal saldo,
boolean ativo
```

### ContaController.ReconciliacaoResponse

Fonte: `src/main/java/com/finisus/adapters/in/web/ContaController.java:122`

```java
Long contaId,
BigDecimal saldoMaterializado,
BigDecimal saldoCalculado,
BigDecimal divergencia,
long quantidadeMovimentos,
long quantidadeAjustes,
boolean conciliado
```

### ContaController.AjusteSaldoRequest

Fonte: `src/main/java/com/finisus/adapters/in/web/ContaController.java:131`

```java
@NotNull @DecimalMin("0.00") BigDecimal saldoInformado,
@NotBlank @Size(max = 500) String motivo
```

### ContaController.AjusteSaldoResponse

Fonte: `src/main/java/com/finisus/adapters/in/web/ContaController.java:134`

```java
Long id,
Long contaId,
BigDecimal saldoAnterior,
BigDecimal saldoCalculadoAnterior,
BigDecimal saldoInformado,
BigDecimal valorAjuste,
String motivo,
java.time.LocalDate dataAjuste
```

### DashboardFinanceiroController.MensalResponse

Fonte: `src/main/java/com/finisus/adapters/in/web/DashboardFinanceiroController.java:85`

```java
String anoMes,
ResumoResponse resumo,
List<CategoriaResponse> categorias
```

### DashboardFinanceiroController.ResumoResponse

Fonte: `src/main/java/com/finisus/adapters/in/web/DashboardFinanceiroController.java:92`

```java
BigDecimal receitas,
BigDecimal gastosDiretos,
BigDecimal gastosFaturas,
BigDecimal valorFaturasPago,
BigDecimal valorFaturasEmAberto,
BigDecimal resultadoCompetencia,
BigDecimal resultadoCaixa,
String situacaoCompetencia,
String situacaoCaixa
```

### DashboardFinanceiroController.ResumoPeriodoResponse

Fonte: `src/main/java/com/finisus/adapters/in/web/DashboardFinanceiroController.java:102`

```java
String mesInicial,
String mesFinal,
int periodoMeses,
TotaisPeriodoResponse totais,
List<OrigemResumoResponse> origens
```

### DashboardFinanceiroController.TotaisPeriodoResponse

Fonte: `src/main/java/com/finisus/adapters/in/web/DashboardFinanceiroController.java:111`

```java
BigDecimal receitas,
BigDecimal despesas,
BigDecimal pagamentosFaturas,
BigDecimal resultadoCompetencia,
BigDecimal resultadoCaixa
```

### DashboardFinanceiroController.ResumoAnualResponse

Fonte: `src/main/java/com/finisus/adapters/in/web/DashboardFinanceiroController.java:119`

```java
String ano,
List<ResumoMesResponse> meses,
TotaisResponse totais
```

### DashboardFinanceiroController.ResumoMesResponse

Fonte: `src/main/java/com/finisus/adapters/in/web/DashboardFinanceiroController.java:126`

```java
String anoMes,
BigDecimal receitas,
BigDecimal gastosDiretos,
BigDecimal gastosFaturas,
BigDecimal pagamentosFaturas,
BigDecimal resultadoCompetencia,
BigDecimal resultadoCaixa
```

### DashboardFinanceiroController.ComposicaoAnualResponse

Fonte: `src/main/java/com/finisus/adapters/in/web/DashboardFinanceiroController.java:135`

```java
String ano,
TotaisPeriodoResponse totais,
List<OrigemResumoResponse> origens,
List<CategoriaResponse> categorias
```

### DashboardFinanceiroController.OrigemResumoResponse

Fonte: `src/main/java/com/finisus/adapters/in/web/DashboardFinanceiroController.java:144`

```java
String origem,
BigDecimal receitas,
BigDecimal despesas,
BigDecimal pagamentosFaturas
```

### DashboardFinanceiroController.CategoriaResponse

Fonte: `src/main/java/com/finisus/adapters/in/web/DashboardFinanceiroController.java:152`

```java
Long categoriaId,
String categoriaNome,
BigDecimal receitas,
BigDecimal despesas,
BigDecimal saldo
```

### DashboardFinanceiroController.BalanceteResponse

Fonte: `src/main/java/com/finisus/adapters/in/web/DashboardFinanceiroController.java:160`

```java
PaginaResponse<LinhaResponse> linhas,
TotaisResponse totais
```

### DashboardFinanceiroController.LinhaResponse

Fonte: `src/main/java/com/finisus/adapters/in/web/DashboardFinanceiroController.java:167`

```java
Long id,
LocalDate data,
String descricao,
TipoTransacao tipo,
BigDecimal valor,
Long contaId,
Long categoriaId,
String categoriaNome,
String origem,
Long faturaId
```

### DashboardFinanceiroController.TotaisResponse

Fonte: `src/main/java/com/finisus/adapters/in/web/DashboardFinanceiroController.java:175`

```java
BigDecimal receitas,
BigDecimal gastosDiretos,
BigDecimal gastosFaturas,
BigDecimal pagamentosFaturas,
BigDecimal resultadoCompetencia,
BigDecimal resultadoCaixa
```

### DivisaoCompartilhadaController.CriarRequest

Fonte: `src/main/java/com/finisus/adapters/in/web/DivisaoCompartilhadaController.java:205`

```java
@NotBlank @Size(max = 120) String nome,
@NotEmpty List<@Valid ParticipanteRequest> participantes
```

### DivisaoCompartilhadaController.ParticipantesRequest

Fonte: `src/main/java/com/finisus/adapters/in/web/DivisaoCompartilhadaController.java:206`

```java
@NotEmpty List<@Valid ParticipanteRequest> participantes
```

### DivisaoCompartilhadaController.ParticipanteRequest

Fonte: `src/main/java/com/finisus/adapters/in/web/DivisaoCompartilhadaController.java:207`

```java
@Positive Long usuarioId,
@DecimalMin("0.01") @DecimalMax("100.00") BigDecimal percentual
```

### DivisaoCompartilhadaController.AssociarTransacaoRequest

Fonte: `src/main/java/com/finisus/adapters/in/web/DivisaoCompartilhadaController.java:208`

```java
@Positive Long transacaoId,
@DecimalMin("0.01") BigDecimal baseCompartilhada,
List<@Valid ResponsabilidadeRequest> responsabilidades
```

### DivisaoCompartilhadaController.RevisarResponsabilidadesRequest

Fonte: `src/main/java/com/finisus/adapters/in/web/DivisaoCompartilhadaController.java:211`

```java
@NotEmpty List<@Valid ResponsabilidadeRequest> responsabilidades
```

### DivisaoCompartilhadaController.ResponsabilidadeRequest

Fonte: `src/main/java/com/finisus/adapters/in/web/DivisaoCompartilhadaController.java:213`

```java
@NotNull @Positive Long usuarioId,
@DecimalMin("0.01") @DecimalMax("100.00") BigDecimal percentual,
@DecimalMin("0.01") BigDecimal valorDevido
```

### DivisaoCompartilhadaController.VinculoPendenteResponse

Fonte: `src/main/java/com/finisus/adapters/in/web/DivisaoCompartilhadaController.java:216`

```java
Long transacaoId,
Long pagadorId,
LocalDate data,
String descricao,
BigDecimal valor
```

### DivisaoCompartilhadaController.DivisaoResponse

Fonte: `src/main/java/com/finisus/adapters/in/web/DivisaoCompartilhadaController.java:224`

```java
Long id,
String nome,
Long criadorId,
StatusDivisaoCompartilhada status,
List<ParticipanteResponse> participantes
```

### DivisaoCompartilhadaController.ParticipanteResponse

Fonte: `src/main/java/com/finisus/adapters/in/web/DivisaoCompartilhadaController.java:233`

```java
Long usuarioId,
BigDecimal percentual
```

### DivisaoCompartilhadaController.HistoricoParticipanteResponse

Fonte: `src/main/java/com/finisus/adapters/in/web/DivisaoCompartilhadaController.java:234`

```java
Long usuarioId,
BigDecimal percentual,
LocalDateTime vigenteDesde,
LocalDateTime vigenteAte
```

### DivisaoCompartilhadaController.AlocacaoPagamentoResponse

Fonte: `src/main/java/com/finisus/adapters/in/web/DivisaoCompartilhadaController.java:236`

```java
Long id,
Long transacaoId,
Long pagadorId,
BigDecimal valor,
LocalDateTime criadaEm,
LocalDateTime canceladaEm,
Long canceladaPor
```

### DivisaoCompartilhadaController.AlocacoesPagamentoRequest

Fonte: `src/main/java/com/finisus/adapters/in/web/DivisaoCompartilhadaController.java:238`

```java
@NotEmpty List<@Valid AlocacaoPagamentoRequest> alocacoes
```

### DivisaoCompartilhadaController.AlocacaoPagamentoRequest

Fonte: `src/main/java/com/finisus/adapters/in/web/DivisaoCompartilhadaController.java:239`

```java
@NotNull @Positive Long transacaoId,
@NotNull @DecimalMin("0.01") BigDecimal valor
```

### DivisaoCompartilhadaController.ResumoPagamentoResponse

Fonte: `src/main/java/com/finisus/adapters/in/web/DivisaoCompartilhadaController.java:241`

```java
Long divisaoId,
Long transacaoId,
BigDecimal baseCompartilhada,
BigDecimal pago,
BigDecimal pendente,
StatusPagamentoDivisao status,
List<AlocacaoPagamentoResponse> alocacoes
```

### DivisaoCompartilhadaController.ReembolsoRequest

Fonte: `src/main/java/com/finisus/adapters/in/web/DivisaoCompartilhadaController.java:244`

```java
@NotNull @Positive Long transacaoId,
@NotNull @Positive Long recebedorId,
@NotNull @DecimalMin("0.01") BigDecimal valor
```

### DivisaoCompartilhadaController.ReembolsoResponse

Fonte: `src/main/java/com/finisus/adapters/in/web/DivisaoCompartilhadaController.java:246`

```java
Long id,
Long transacaoId,
Long pagadorId,
Long recebedorId,
BigDecimal valor,
LocalDate data,
LocalDateTime criadoEm,
LocalDateTime canceladoEm,
Long canceladoPor
```

### DivisaoCompartilhadaController.ResumoResponse

Fonte: `src/main/java/com/finisus/adapters/in/web/DivisaoCompartilhadaController.java:253`

```java
Long divisaoId,
String divisao,
BigDecimal total,
List<ResumoParticipanteResponse> participantes,
long lancamentosPendentesRevisao
```

### DivisaoCompartilhadaController.ResumoParticipanteResponse

Fonte: `src/main/java/com/finisus/adapters/in/web/DivisaoCompartilhadaController.java:261`

```java
Long usuarioId,
BigDecimal percentual,
BigDecimal pago,
BigDecimal devido,
BigDecimal saldo
```

### FaturaController.Request

Fonte: `src/main/java/com/finisus/adapters/in/web/FaturaController.java:119`

```java
@NotNull @Positive Long cartaoId,
@NotBlank @Pattern(regexp = "\\d{4}-\\d{2}") String anoMes,
@NotNull LocalDate dataFechamento,
@NotNull LocalDate dataVencimento,
@NotNull @Positive Long contaPagamentoId
```

### FaturaController.GastoRequest

Fonte: `src/main/java/com/finisus/adapters/in/web/FaturaController.java:124`

```java
@NotNull @DecimalMin("0.01") BigDecimal valor,
@NotNull LocalDate data,
@NotBlank @Size(max = 500) String descricao,
@NotNull @Positive Long contaId,
@Positive Long categoriaId,
List<@Valid ItemRequest> itens
```

### FaturaController.ItemRequest

Fonte: `src/main/java/com/finisus/adapters/in/web/FaturaController.java:129`

```java
@Positive Long itemId,
@Size(max = 300) String descricao,
@DecimalMin(value = "0.000001") BigDecimal quantidade,
@NotNull @DecimalMin("0.01") BigDecimal valor,
@Positive Long categoriaId
```

### FaturaController.PagamentoRequest

Fonte: `src/main/java/com/finisus/adapters/in/web/FaturaController.java:134`

```java
@DecimalMin("0.01") BigDecimal valor,
@NotNull LocalDate dataPagamento,
@Positive Long contaId
```

### FaturaController.CicloRequest

Fonte: `src/main/java/com/finisus/adapters/in/web/FaturaController.java:138`

```java
@NotNull LocalDate dataReferencia
```

### FaturaController.AtualizarRequest

Fonte: `src/main/java/com/finisus/adapters/in/web/FaturaController.java:141`

```java
@NotNull LocalDate dataFechamento,
@NotNull LocalDate dataVencimento,
@NotNull @Positive Long contaPagamentoId
```

### FaturaController.Response

Fonte: `src/main/java/com/finisus/adapters/in/web/FaturaController.java:145`

```java
Long id,
Long cartaoId,
String anoMes,
LocalDate fechamento,
LocalDate vencimento,
StatusFatura status,
Long contaPagamentoId
```

### FaturaController.DetalheResponse

Fonte: `src/main/java/com/finisus/adapters/in/web/FaturaController.java:154`

```java
Long id,
Long cartaoId,
String anoMes,
LocalDate fechamento,
LocalDate vencimento,
StatusFatura status,
Long contaPagamentoId,
BigDecimal valorTotal,
BigDecimal valorPago,
BigDecimal creditoAplicado,
BigDecimal valorEmAberto,
BigDecimal credito,
List<TransacaoResponse> transacoes
```

### FaturaController.CicloResponse

Fonte: `src/main/java/com/finisus/adapters/in/web/FaturaController.java:168`

```java
List<Response> fechadas,
List<Response> criadas
```

### FinanciamentoController.Request

Fonte: `src/main/java/com/finisus/adapters/in/web/FinanciamentoController.java:100`

```java
@NotBlank @Size(max = 300) String descricao,
@NotNull @DecimalMin("0.01") BigDecimal principal,
@NotNull @DecimalMin("0.00") BigDecimal taxaJurosMensal,
@Min(1) int numeroParcelas,
@NotNull LocalDate dataInicio,
@NotNull @Positive Long contaId
```

### FinanciamentoController.RefinanciamentoRequest

Fonte: `src/main/java/com/finisus/adapters/in/web/FinanciamentoController.java:105`

```java
@NotNull @Positive Long parcelaId,
@NotNull @Valid Request novoFinanciamento
```

### FinanciamentoController.RefinanciamentoResponse

Fonte: `src/main/java/com/finisus/adapters/in/web/FinanciamentoController.java:107`

```java
Response financiamentoOrigem,
Response novoFinanciamento,
int parcelasExcluidas
```

### FinanciamentoController.AmortizacaoRequest

Fonte: `src/main/java/com/finisus/adapters/in/web/FinanciamentoController.java:110`

```java
@NotNull @DecimalMin("0.01") BigDecimal valor,
@NotNull LocalDate dataPagamento,
@PositiveOrZero Integer numeroParcelasRestantes,
com.finisus.domain.model.ModalidadeAmortizacaoFinanciamento modalidade
```

### FinanciamentoController.AmortizacaoResponse

Fonte: `src/main/java/com/finisus/adapters/in/web/FinanciamentoController.java:114`

```java
Response financiamento,
Long transacaoId,
BigDecimal saldoDevedorAnterior,
BigDecimal saldoDevedorAtual,
int parcelasRestantes
```

### FinanciamentoController.ParcelaHistoricaResponse

Fonte: `src/main/java/com/finisus/adapters/in/web/FinanciamentoController.java:117`

```java
Long parcelaIdOrigem,
int numero,
BigDecimal valor,
BigDecimal principal,
BigDecimal juros,
BigDecimal encargos,
BigDecimal saldoDevedorInicial,
BigDecimal saldoDevedorFinal,
LocalDate vencimento,
com.finisus.domain.model.StatusParcelaFinanciamento status,
Long transacaoId
```

### FinanciamentoController.Response

Fonte: `src/main/java/com/finisus/adapters/in/web/FinanciamentoController.java:128`

```java
Long id,
String descricao,
BigDecimal principal,
BigDecimal taxaJurosMensal,
int numeroParcelas,
LocalDate dataInicio,
Long contaId,
com.finisus.domain.model.StatusFinanciamento status,
int cronogramaVersao,
Long financiamentoOrigemId
```

### ImportacaoFinanceiraController.RevisarRequest

Fonte: `src/main/java/com/finisus/adapters/in/web/ImportacaoFinanceiraController.java:82`

```java
@Positive Long contaId,
@Positive Long faturaId,
@NotEmpty List<@Valid LancamentoRequest> lancamentos
```

### ImportacaoFinanceiraController.LancamentoRequest

Fonte: `src/main/java/com/finisus/adapters/in/web/ImportacaoFinanceiraController.java:85`

```java
@NotNull @Positive Long id,
LocalDate data,
String descricao,
BigDecimal valor,
TipoTransacao tipo,
boolean importar,
@Positive Long categoriaId,
@Positive Long itemId,
@Positive Long transacaoId,
@Positive Long obrigacaoFinanceiraId,
@NotBlank @Size(max = 500) String justificativa
```

### ImportacaoFinanceiraController.RevisaoResponse

Fonte: `src/main/java/com/finisus/adapters/in/web/ImportacaoFinanceiraController.java:95`

```java
ImportacaoResponse importacao,
List<PossivelDuplicidadeResponse> possiveisDuplicidades,
List<DivergenciaResponse> divergencias
```

### ImportacaoFinanceiraController.DivergenciaResponse

Fonte: `src/main/java/com/finisus/adapters/in/web/ImportacaoFinanceiraController.java:104`

```java
String codigo,
String mensagem,
String esperado,
String detectado
```

### ImportacaoFinanceiraController.PossivelDuplicidadeResponse

Fonte: `src/main/java/com/finisus/adapters/in/web/ImportacaoFinanceiraController.java:111`

```java
Long lancamentoImportadoId,
Long transacaoId,
Long transferenciaId,
Long obrigacaoFinanceiraId,
LocalDate data,
BigDecimal valor,
String descricao,
ImportacaoFinanceiraUseCase.NivelDuplicidade nivel,
List<String> evidencias
```

### ImportacaoFinanceiraController.ImportacaoResponse

Fonte: `src/main/java/com/finisus/adapters/in/web/ImportacaoFinanceiraController.java:122`

```java
Long id,
Long bancoId,
String nomeArquivo,
String leitor,
TipoDocumentoFinanceiro tipoDocumento,
TipoDocumentoFinanceiro tipoDocumentoPretendido,
String identificadorOrigem,
LocalDate periodoInicio,
LocalDate periodoFim,
LocalDate dataVencimento,
BigDecimal saldoInicial,
BigDecimal saldoFinal,
BigDecimal valorTotal,
String status,
Long contaId,
Long faturaId,
List<LancamentoResponse> lancamentos
```

### ImportacaoFinanceiraController.LancamentoResponse

Fonte: `src/main/java/com/finisus/adapters/in/web/ImportacaoFinanceiraController.java:138`

```java
Long id,
int ordem,
LocalDate data,
String descricao,
String conteudoOriginal,
LocalDate dataOriginal,
String descricaoOriginal,
BigDecimal valorOriginal,
TipoTransacao tipoOriginal,
BigDecimal valor,
TipoTransacao tipo,
boolean pendenteConfirmacao,
String motivoPendencia,
EstadoLancamentoImportado estado,
boolean importar,
Long categoriaId,
Long itemId,
Long transacaoId,
Long obrigacaoFinanceiraId,
List<RevisaoLancamentoResponse> revisoes
```

### ImportacaoFinanceiraController.RevisaoLancamentoResponse

Fonte: `src/main/java/com/finisus/adapters/in/web/ImportacaoFinanceiraController.java:157`

```java
Long id,
Long revisadoPor,
String decisao,
String motivoIncerteza,
String justificativa,
com.finisus.domain.model.RevisaoLancamentoImportado.Estado anterior,
com.finisus.domain.model.RevisaoLancamentoImportado.Estado novo,
java.time.LocalDateTime revisadoEm
```

### InvestimentoController.Request

Fonte: `src/main/java/com/finisus/adapters/in/web/InvestimentoController.java:79`

```java
@NotBlank @Size(max = 150) String nome,
@NotNull TipoInvestimento tipo,
@NotNull @Positive Long contaOrigemId,
@Positive Long contaCustodiaId
```

### InvestimentoController.Response

Fonte: `src/main/java/com/finisus/adapters/in/web/InvestimentoController.java:83`

```java
Long id,
String nome,
TipoInvestimento tipo,
Long contaOrigemId,
Long contaCustodiaId,
boolean ativo
```

### ItemController.Request

Fonte: `src/main/java/com/finisus/adapters/in/web/ItemController.java:75`

```java
@NotBlank @Size(max = 300) String nome,
@Positive Long categoriaPadraoId
```

### ItemController.Response

Fonte: `src/main/java/com/finisus/adapters/in/web/ItemController.java:78`

```java
Long id,
String nome,
Long categoriaPadraoId,
boolean ativo
```

### MeioPagamentoController.Request

Fonte: `src/main/java/com/finisus/adapters/in/web/MeioPagamentoController.java:74`

```java
@NotBlank @Size(max = 100) String nome
```

### MeioPagamentoController.Response

Fonte: `src/main/java/com/finisus/adapters/in/web/MeioPagamentoController.java:77`

```java
Long id,
String nome,
boolean ativo
```

### MovimentoInvestimentoController.Request

Fonte: `src/main/java/com/finisus/adapters/in/web/MovimentoInvestimentoController.java:65`

```java
@NotNull @Positive Long investimentoId,
@NotNull TipoMovimentoInvestimento tipo,
@NotNull @DecimalMin("0.01") BigDecimal valor,
@NotNull LocalDate data
```

### MovimentoInvestimentoController.Response

Fonte: `src/main/java/com/finisus/adapters/in/web/MovimentoInvestimentoController.java:69`

```java
Long id,
Long investimentoId,
TipoMovimentoInvestimento tipo,
BigDecimal valor,
LocalDate data,
Long transacaoId,
Long movimentoOrigemId,
java.time.LocalDateTime estornadoEm
```

### ObrigacaoFinanceiraController.Request

Fonte: `src/main/java/com/finisus/adapters/in/web/ObrigacaoFinanceiraController.java:95`

```java
@NotBlank @Size(max = 300) String descricao,
@NotBlank @Size(max = 150) String credor,
@NotNull @DecimalMin("0.01") BigDecimal valor,
@NotNull LocalDate dataVencimento,
@NotNull @Positive Long contaPagamentoId,
@Positive Long categoriaId
```

### ObrigacaoFinanceiraController.PagamentoRequest

Fonte: `src/main/java/com/finisus/adapters/in/web/ObrigacaoFinanceiraController.java:98`

```java
@NotNull LocalDate dataPagamento,
@DecimalMin("0.01") BigDecimal valor,
@PositiveOrZero BigDecimal juros,
@PositiveOrZero BigDecimal encargos,
@PositiveOrZero BigDecimal desconto
```

### ObrigacaoFinanceiraController.Response

Fonte: `src/main/java/com/finisus/adapters/in/web/ObrigacaoFinanceiraController.java:101`

```java
Long id,
String descricao,
String credor,
BigDecimal valor,
LocalDate dataVencimento,
Long contaPagamentoId,
Long categoriaId,
StatusObrigacaoFinanceira status,
LocalDate dataLiquidacao,
Long transacaoId,
BigDecimal valorPago,
BigDecimal saldoPendente
```

### ObrigacaoFinanceiraController.PagamentoResponse

Fonte: `src/main/java/com/finisus/adapters/in/web/ObrigacaoFinanceiraController.java:111`

```java
Long id,
Long transacaoId,
BigDecimal valor,
BigDecimal juros,
BigDecimal encargos,
BigDecimal desconto,
BigDecimal valorAbatido,
BigDecimal valorCaixa,
LocalDate dataPagamento,
java.time.LocalDateTime estornadoEm
```

### PainelFinanceiroController.VisaoGeralResponse

Fonte: `src/main/java/com/finisus/adapters/in/web/PainelFinanceiroController.java:61`

```java
LocalDate referencia,
BigDecimal saldoContas,
BigDecimal resultadoCompetenciaOperacional,
BigDecimal resultadoCaixa,
BigDecimal comprometidoNaJanela,
BigDecimal saldoLivreNaJanela,
List<CategoriaGastoResponse> maioresGastos,
List<AlertaResponse> alertas
```

### PainelFinanceiroController.CategoriaGastoResponse

Fonte: `src/main/java/com/finisus/adapters/in/web/PainelFinanceiroController.java:72`

```java
Long categoriaId,
String categoria,
BigDecimal valor
```

### PainelFinanceiroController.AlertaResponse

Fonte: `src/main/java/com/finisus/adapters/in/web/PainelFinanceiroController.java:78`

```java
String tipo,
String descricao,
LocalDate vencimento,
BigDecimal valor,
String nivel
```

### PainelFinanceiroController.AgendaResponse

Fonte: `src/main/java/com/finisus/adapters/in/web/PainelFinanceiroController.java:84`

```java
LocalDate inicio,
LocalDate fim,
BigDecimal totalComprometido,
List<CompromissoResponse> compromissos
```

### PainelFinanceiroController.CompromissoResponse

Fonte: `src/main/java/com/finisus/adapters/in/web/PainelFinanceiroController.java:92`

```java
String tipo,
Long referenciaId,
String descricao,
LocalDate vencimento,
BigDecimal valor,
String situacao
```

### PainelFinanceiroController.PatrimonioResponse

Fonte: `src/main/java/com/finisus/adapters/in/web/PainelFinanceiroController.java:100`

```java
LocalDate referencia,
Instant saldosEDividasConsultadosEm,
boolean patrimonioHistoricoCompleto,
BigDecimal saldoContas,
BigDecimal capitalLiquidoInvestido,
BigDecimal valorAtualInvestimentos,
BigDecimal faturasEmAberto,
BigDecimal obrigacoesEmAberto,
BigDecimal parcelasFinanciamentoEmAberto,
BigDecimal principalFinanciamentosEmAberto,
BigDecimal jurosEncargosFinanciamentosFuturos,
BigDecimal parcelasFinanciamentoSemComposicao,
BigDecimal comprasParceladasRestantes,
BigDecimal dividasPrincipais,
BigDecimal dividasECompromissos,
BigDecimal patrimonioLiquido,
List<PosicaoInvestimentoResponse> investimentos
```

### PainelFinanceiroController.PosicaoInvestimentoResponse

Fonte: `src/main/java/com/finisus/adapters/in/web/PainelFinanceiroController.java:121`

```java
Long investimentoId,
String investimento,
String tipo,
BigDecimal capitalLiquido,
BigDecimal valorAtual,
LocalDate dataPosicao,
boolean posicaoInformada
```

### PainelFinanceiroController.CompartilhadosResponse

Fonte: `src/main/java/com/finisus/adapters/in/web/PainelFinanceiroController.java:129`

```java
LocalDate inicio,
LocalDate fim,
BigDecimal aReceber,
BigDecimal aPagar,
List<ResumoDivisaoCompartilhadaResponse> divisoes
```

### PainelFinanceiroController.ResumoDivisaoCompartilhadaResponse

Fonte: `src/main/java/com/finisus/adapters/in/web/PainelFinanceiroController.java:138`

```java
Long divisaoId,
String divisao,
BigDecimal total,
BigDecimal meuPago,
BigDecimal meuDevido,
BigDecimal meuSaldo,
List<ParticipanteCompartilhadoResponse> participantes
```

### PainelFinanceiroController.ParticipanteCompartilhadoResponse

Fonte: `src/main/java/com/finisus/adapters/in/web/PainelFinanceiroController.java:147`

```java
Long usuarioId,
String nomeExibicao,
BigDecimal pago,
BigDecimal devido,
BigDecimal saldo
```

### PainelFinanceiroController.AnaliseReceitasGastosResponse

Fonte: `src/main/java/com/finisus/adapters/in/web/PainelFinanceiroController.java:155`

```java
String mesInicial,
String mesFinal,
int periodoMeses,
BigDecimal receitasOperacionais,
BigDecimal gastosDeConsumo,
BigDecimal resultadoOperacional,
BigDecimal despesasFixasPrevistas,
List<CategoriaAnaliseResponse> categorias
```

### PainelFinanceiroController.CategoriaAnaliseResponse

Fonte: `src/main/java/com/finisus/adapters/in/web/PainelFinanceiroController.java:165`

```java
Long categoriaId,
String categoria,
BigDecimal receitas,
BigDecimal despesas,
BigDecimal saldo
```

### ParcelaFinanciamentoController.RefinanciamentoResponse

Fonte: `src/main/java/com/finisus/adapters/in/web/ParcelaFinanciamentoController.java:80`

```java
Long financiamentoId,
LocalDateTime finalizadoEm,
int parcelasExcluidas,
String mensagem
```

### ParcelaFinanciamentoController.PagamentoRequest

Fonte: `src/main/java/com/finisus/adapters/in/web/ParcelaFinanciamentoController.java:88`

```java
@NotNull LocalDate dataPagamento
```

### ParcelaFinanciamentoController.Response

Fonte: `src/main/java/com/finisus/adapters/in/web/ParcelaFinanciamentoController.java:91`

```java
Long id,
int numero,
BigDecimal valor,
BigDecimal principal,
BigDecimal juros,
BigDecimal encargos,
BigDecimal saldoDevedorInicial,
BigDecimal saldoDevedorFinal,
LocalDate vencimento,
StatusParcelaFinanciamento status,
Long transacaoId
```

### PerfilUsuarioController.Request

Fonte: `src/main/java/com/finisus/adapters/in/web/PerfilUsuarioController.java:81`

```java
@NotBlank @Size(max = 150) String nome,
@NotBlank @Email String email
```

### PerfilUsuarioController.Response

Fonte: `src/main/java/com/finisus/adapters/in/web/PerfilUsuarioController.java:84`

```java
Long id,
String nome,
String email,
boolean ativo
```

### PerfilUsuarioController.SolicitacaoRequest

Fonte: `src/main/java/com/finisus/adapters/in/web/PerfilUsuarioController.java:90`

```java
@NotBlank @Size(max = 500) String motivo
```

### PerfilUsuarioController.ExportacaoResponse

Fonte: `src/main/java/com/finisus/adapters/in/web/PerfilUsuarioController.java:92`

```java
int versaoFormato,
Instant geradaEm,
Map<String, List<Map<String, Object>>> secoes
```

### PerfilUsuarioController.SolicitacaoResponse

Fonte: `src/main/java/com/finisus/adapters/in/web/PerfilUsuarioController.java:99`

```java
Long id,
String tipo,
String status,
String motivo,
LocalDateTime solicitadaEm,
LocalDateTime concluidaEm,
String observacao
```

### PosicaoInvestimentoController.Request

Fonte: `src/main/java/com/finisus/adapters/in/web/PosicaoInvestimentoController.java:56`

```java
@NotNull @DecimalMin("0.00") BigDecimal valor,
@NotNull LocalDate dataReferencia
```

### PosicaoInvestimentoController.Response

Fonte: `src/main/java/com/finisus/adapters/in/web/PosicaoInvestimentoController.java:57`

```java
Long id,
Long investimentoId,
BigDecimal valor,
LocalDate dataReferencia
```

### PrevisaoFluxoCaixaController.Response

Fonte: `src/main/java/com/finisus/adapters/in/web/PrevisaoFluxoCaixaController.java:53`

```java
String anoMes,
Long categoriaId,
BigDecimal entrada,
BigDecimal saida
```

### RecorrenciaController.Request

Fonte: `src/main/java/com/finisus/adapters/in/web/RecorrenciaController.java:102`

```java
@NotBlank @Size(max = 150) String nome,
@NotNull TipoTransacao tipo,
@NotNull @DecimalMin("0.01") BigDecimal valorEsperado,
@Min(1) @Max(31) int diaDoMes,
@Positive Long categoriaId,
@NotNull @Positive Long contaId,
@Positive Long meioPagamentoId
```

### RecorrenciaController.Response

Fonte: `src/main/java/com/finisus/adapters/in/web/RecorrenciaController.java:107`

```java
Long id,
String nome,
TipoTransacao tipo,
BigDecimal valorEsperado,
int diaDoMes,
Long categoriaId,
Long contaId,
Long meioPagamentoId,
boolean ativo
```

### RecorrenciaController.OcorrenciaResponse

Fonte: `src/main/java/com/finisus/adapters/in/web/RecorrenciaController.java:115`

```java
Long id,
Long recorrenciaId,
String anoMes,
LocalDate vencimento,
TipoTransacao tipo,
BigDecimal valor,
String descricao,
Long contaId,
Long categoriaId,
Long meioPagamentoId,
StatusOcorrenciaRecorrencia status,
Long transacaoId
```

### TransacaoController.Request

Fonte: `src/main/java/com/finisus/adapters/in/web/TransacaoController.java:133`

```java
@NotNull TipoTransacao tipo,
@NotNull @DecimalMin("0.01") BigDecimal valor,
@NotNull LocalDate data,
@NotBlank @Size(max = 500) String descricao,
@NotNull @Positive Long contaId,
@Positive Long categoriaId,
@Positive Long meioPagamentoId,
List<@Valid ItemRequest> itens
```

### TransacaoController.CorrecaoRequest

Fonte: `src/main/java/com/finisus/adapters/in/web/TransacaoController.java:138`

```java
@NotNull TipoTransacao tipo,
@NotNull @DecimalMin("0.01") BigDecimal valor,
@NotNull LocalDate data,
@NotBlank @Size(max = 500) String descricao,
@NotNull @Positive Long contaId,
@Positive Long categoriaId,
@Positive Long meioPagamentoId,
List<@Valid ItemRequest> itens,
@NotBlank @Size(max = 500) String motivo
```

### TransacaoController.DetalhamentoRequest

Fonte: `src/main/java/com/finisus/adapters/in/web/TransacaoController.java:144`

```java
@NotEmpty List<@Valid ItemRequest> itens,
@NotBlank @Size(max = 500) String motivo
```

### TransacaoController.ItemRequest

Fonte: `src/main/java/com/finisus/adapters/in/web/TransacaoController.java:153`

```java
@Positive Long itemId,
@Size(max = 300) String descricao,
@DecimalMin(value = "0.000001") BigDecimal quantidade,
@NotNull @DecimalMin("0.01") BigDecimal valor,
@Positive Long categoriaId
```

### TransacaoController.HistoricoResponse

Fonte: `src/main/java/com/finisus/adapters/in/web/TransacaoController.java:158`

```java
Long id,
String campoAlterado,
String valorAnterior,
String valorNovo,
Long alteradoPor,
LocalDateTime alteradoEm,
String motivo,
String correlacaoId,
String snapshotAnterior,
String snapshotNovo
```

### TransferenciaContaController.Request

Fonte: `src/main/java/com/finisus/adapters/in/web/TransferenciaContaController.java:64`

```java
@NotNull @Positive Long contaOrigemId,
@NotNull @Positive Long contaDestinoId,
@NotNull @DecimalMin("0.01") BigDecimal valor,
@NotNull LocalDate data,
@NotBlank @Size(max = 300) String descricao
```

### TransferenciaContaController.Response

Fonte: `src/main/java/com/finisus/adapters/in/web/TransferenciaContaController.java:68`

```java
Long id,
Long contaOrigemId,
Long contaDestinoId,
BigDecimal valor,
LocalDate data,
String descricao,
StatusTransferencia status,
LocalDateTime estornadaEm
```

### PaginaResponse.PaginaResponse

Fonte: `src/main/java/com/finisus/adapters/in/web/PaginaResponse.java:7`

```java
List<T> conteudo,
int pagina,
int tamanho,
long totalElementos,
int totalPaginas
```

### TransacaoResponse.TransacaoResponse

Fonte: `src/main/java/com/finisus/adapters/in/web/TransacaoResponse.java:11`

```java
Long id,
TipoTransacao tipo,
BigDecimal valor,
LocalDate data,
String descricao,
Long contaId,
Long categoriaId,
Long meioPagamentoId,
List<ItemResponse> itens
```

### TransacaoResponse.ItemResponse

Fonte: `src/main/java/com/finisus/adapters/in/web/TransacaoResponse.java:19`

```java
Long id,
Long itemId,
String descricao,
BigDecimal quantidade,
BigDecimal valor,
Long categoriaId
```

## Enums

| Nome                               | Valores                                                                                    | Fonte                                                                              |
| ---------------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| OrigemLinha                        | DIRETA, FATURA, PAGAMENTO_FATURA                                                           | src/main/java/com/finisus/application/ports/in/DashboardFinanceiroUseCase.java:75  |
| SituacaoResultado                  | POSITIVO, NEGATIVO, NEUTRO                                                                 | src/main/java/com/finisus/application/ports/in/DashboardFinanceiroUseCase.java:79  |
| OrigemResumo                       | MOVIMENTACAO_DIRETA, RECORRENCIA, COMPRA_PARCELADA, CARTAO, PAGAMENTO_FATURA, INVESTIMENTO | src/main/java/com/finisus/application/ports/in/DashboardFinanceiroUseCase.java:83  |
| NivelDuplicidade                   | EXATA, PROVAVEL                                                                            | src/main/java/com/finisus/application/ports/in/ImportacaoFinanceiraUseCase.java:31 |
| DecisaoRevisaoImportacao           | CRIAR, IGNORAR, ASSOCIAR_TRANSACAO, ASSOCIAR_OBRIGACAO                                     | src/main/java/com/finisus/domain/model/DecisaoRevisaoImportacao.java:3             |
| EstadoLancamentoImportado          | PENDENTE, IGNORADA, ASSOCIADA, CRIADA                                                      | src/main/java/com/finisus/domain/model/EstadoLancamentoImportado.java:3            |
| ModalidadeAmortizacaoFinanciamento | REDUZIR_PRAZO, REDUZIR_PRESTACAO                                                           | src/main/java/com/finisus/domain/model/ModalidadeAmortizacaoFinanciamento.java:3   |
| ModalidadeCompartilhamentoItem     | INTEGRAL, QUANTIDADE, PERCENTUAL, VALOR                                                    | src/main/java/com/finisus/domain/model/ModalidadeCompartilhamentoItem.java:3       |
| PermissaoUsuario                   | USUARIO_CADASTRAR, USUARIO_DESBLOQUEAR                                                     | src/main/java/com/finisus/domain/model/PermissaoUsuario.java:3                     |
| Tipo                               | ANONIMIZACAO                                                                               | src/main/java/com/finisus/domain/model/SolicitacaoPrivacidade.java:7               |
| Status                             | SOLICITADA, EM_ANALISE, CONCLUIDA, RECUSADA                                                | src/main/java/com/finisus/domain/model/SolicitacaoPrivacidade.java:8               |
| StatusDivisaoCompartilhada         | ATIVA, INATIVA                                                                             | src/main/java/com/finisus/domain/model/StatusDivisaoCompartilhada.java:3           |
| StatusFatura                       | ABERTA, FECHADA, PAGA, CANCELADA                                                           | src/main/java/com/finisus/domain/model/StatusFatura.java:3                         |
| StatusFinanciamento                | ATIVO, FINALIZADO, CANCELADO                                                               | src/main/java/com/finisus/domain/model/StatusFinanciamento.java:3                  |
| StatusImportacaoFinanceira         | PENDENTE_REVISAO, CONFIRMADA                                                               | src/main/java/com/finisus/domain/model/StatusImportacaoFinanceira.java:3           |
| StatusObrigacaoFinanceira          | EM_ABERTO, PAGA, VENCIDA, CANCELADA                                                        | src/main/java/com/finisus/domain/model/StatusObrigacaoFinanceira.java:3            |
| StatusOcorrenciaRecorrencia        | PENDENTE, REALIZADA                                                                        | src/main/java/com/finisus/domain/model/StatusOcorrenciaRecorrencia.java:3          |
| StatusPagamentoDivisao             | PENDENTE, PARCIAL, QUITADO                                                                 | src/main/java/com/finisus/domain/model/StatusPagamentoDivisao.java:3               |
| StatusParcelaFinanciamento         | PENDENTE, PAGA, ATRASADA                                                                   | src/main/java/com/finisus/domain/model/StatusParcelaFinanciamento.java:3           |
| StatusSnapshotDivisao              | CONFIRMADO, PENDENTE_REVISAO                                                               | src/main/java/com/finisus/domain/model/StatusSnapshotDivisao.java:3                |
| StatusTransferencia                | ATIVA, ESTORNADA                                                                           | src/main/java/com/finisus/domain/model/StatusTransferencia.java:3                  |
| TipoConta                          | FISICO, CORRENTE, POUPANCA, APLICACAO                                                      | src/main/java/com/finisus/domain/model/TipoConta.java:3                            |
| TipoDocumentoFinanceiro            | EXTRATO_CONTA, FATURA_CARTAO, COBRANCA                                                     | src/main/java/com/finisus/domain/model/TipoDocumentoFinanceiro.java:3              |
| TipoInvestimento                   | RENDA_FIXA, RENDA_VARIAVEL, FUNDO, CRIPTO, OUTRO                                           | src/main/java/com/finisus/domain/model/TipoInvestimento.java:3                     |
| TipoMovimentoInvestimento          | APORTE, RESGATE, RENDIMENTO_REALIZADO, TAXA                                                | src/main/java/com/finisus/domain/model/TipoMovimentoInvestimento.java:3            |
| TipoTransacao                      | ENTRADA, SAIDA                                                                             | src/main/java/com/finisus/domain/model/TipoTransacao.java:3                        |
