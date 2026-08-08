# Como contribuir

Obrigado pelo interesse em contribuir com o Finisus. Relate problemas e proponha melhorias em issues; para alterações de código ou documentação, abra um pull request a partir de uma branch própria.

## Fluxo de contribuição

Direcione alterações funcionais para `development`. A branch `master` representa a linha estável e recebe mudanças por pull request. Mantenha cada pull request focado em uma intenção, descreva o comportamento alterado e inclua testes quando a mudança afetar interface, autenticação, integração HTTP, acessibilidade ou segurança.

Antes de enviar a proposta, execute:

```bash
npm run format:check
npm run lint
npm test
npm run build
```

Não inclua segredos, chaves, senhas, arquivos locais de ambiente, `node_modules/`, `dist/` ou `.angular/cache/`.

## Direitos sobre contribuições

O Finisus é mantido sob AGPL e também pode ser oferecido sob licença comercial. Para que ambas as modalidades sejam possíveis, toda contribuição aceita deve estar coberta pelo [Contributor License Agreement](CLA.md).

Na primeira contribuição, declare no pull request que leu e concorda com o CLA e que tem autoridade para conceder esses direitos. O mantenedor pode solicitar confirmação adicional antes do merge. Organizações devem garantir que a pessoa contribuinte possui autorização do empregador, quando aplicável.
