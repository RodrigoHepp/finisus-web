import ts from 'typescript';
import { format, resolveConfig } from 'prettier';
import { aliasesDtosHttp } from './aliases-dtos-http.mjs';
import { readFileSync, writeFileSync } from 'node:fs';
const catalogo = JSON.parse(readFileSync('docs/contratos/inventario-http.json', 'utf8'));
// Rejeita aliases que omitem campos do catálogo atual.
const programa = ts.createProgram(['src/app/infraestrutura/api/contratos-http.ts'], {
  target: ts.ScriptTarget.ESNext,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
});
const verificadorTipos = programa.getTypeChecker();
const fonteCanonica = programa.getSourceFile('src/app/infraestrutura/api/contratos-http.ts');
const simbolos = verificadorTipos.getExportsOfModule(
  verificadorTipos.getSymbolAtLocation(fonteCanonica),
);
for (const esquema of catalogo.schemas) {
  const nome = esquema.controller.replace('Controller', '') + esquema.name;
  const alias = aliasesDtosHttp[nome];
  if (!alias) continue;
  const simbolo = simbolos.find((entrada) => entrada.name === alias);
  if (!simbolo) throw new Error('Alias HTTP inexistente: ' + alias);
  const camposAtuais = verificadorTipos
    .getPropertiesOfType(verificadorTipos.getDeclaredTypeOfSymbol(simbolo))
    .map((entrada) => entrada.name)
    .sort();
  const camposEsperados = esquema.fields.map((campo) => campo.name).sort();
  if (JSON.stringify(camposAtuais) !== JSON.stringify(camposEsperados))
    throw new Error('Campos HTTP divergentes: ' + nome);
}
const enums = new Map(catalogo.enums.map((enumeracao) => [enumeracao.name, enumeracao.values]));
function converterTipo(tipoJava, controller) {
  if (tipoJava.startsWith('List<'))
    return `Array<${converterTipo(tipoJava.slice(5, -1), controller)}>`;
  if (tipoJava.startsWith('PaginaResponse<'))
    return `Pagina<${converterTipo(tipoJava.slice(15, -1), controller)}>`;
  if (tipoJava.startsWith('Map<')) return 'Record<string, Array<Record<string, unknown>>>';
  if (tipoJava === 'T') return 'T';
  if (['Long', 'Integer', 'int', 'long', 'BigDecimal'].includes(tipoJava)) return 'number';
  if (tipoJava === 'boolean') return 'boolean';
  if (
    [
      'String',
      'Instant',
      'LocalDate',
      'LocalDateTime',
      'java.time.LocalDate',
      'java.time.LocalDateTime',
    ].includes(tipoJava)
  )
    return 'string';
  const nomeSimples = tipoJava.split('.').at(-1);
  if (enums.has(nomeSimples)) return nomeSimples;
  if (
    catalogo.schemas.some(
      (esquema) => esquema.controller === controller && esquema.name === nomeSimples,
    )
  )
    return `${controller.replace('Controller', '')}${nomeSimples}`;
  if (nomeSimples === 'Estado') return 'RevisaoEstado';
  if (nomeSimples === 'NivelDuplicidade') return 'NivelDuplicidade';
  if (nomeSimples === 'TransacaoResponse') return 'TransacaoHttp';
  throw new Error(`Tipo não resolvido ${controller}: ${tipoJava}`);
}
let conteudoGerado =
  '// DTOs HTTP do checkout. Não recalcular valores financeiros. Datas são strings civis/ISO.\n';
for (const [nome, valores] of enums)
  conteudoGerado += `export type ${nome} = ${valores.map((valor) => JSON.stringify(valor)).join(' | ')};\n`;
conteudoGerado +=
  'export interface RevisaoEstado { data: string; descricao: string; valor: number; tipo: TipoTransacao; importar: boolean; categoriaId: number | null; itemId: number | null; transacaoId: number | null; obrigacaoFinanceiraId: number | null; }\n';
conteudoGerado += "export type { Transacao as TransacaoHttp } from './contratos-http';\n";
conteudoGerado +=
  'export interface Pagina<T> { conteudo: T[]; pagina: number; tamanho: number; totalElementos: number; totalPaginas: number; }\n';
for (const esquema of catalogo.schemas) {
  if (esquema.name === 'PaginaResponse') continue;
  const nome = `${esquema.controller.replace('Controller', '')}${esquema.name}`;
  const aliasCanonico = aliasesDtosHttp[nome];
  if (aliasCanonico) {
    conteudoGerado += `export type ${nome} = import('./contratos-http').${aliasCanonico};\n`;
    continue;
  }
  conteudoGerado += `export interface ${esquema.controller.replace('Controller', '')}${esquema.name} {\n`;
  for (const campo of esquema.fields) {
    const primitivo = ['boolean', 'int', 'long'].includes(campo.javaType);
    // Preserva a nulabilidade das referências Java; validadores restringem o envio.
    conteudoGerado += `  ${campo.name}: ${converterTipo(campo.javaType, esquema.controller)}${primitivo || campo.requiredByValidation || campo.javaType.startsWith('List<') ? '' : ' | null'};\n`;
  }
  conteudoGerado += '}\n';
}
const arquivoDestino = 'src/app/infraestrutura/api/backend.dtos.ts';
conteudoGerado = await format(conteudoGerado, {
  ...(await resolveConfig(arquivoDestino)),
  filepath: arquivoDestino,
});
if (process.argv.includes('--check')) {
  if (
    readFileSync(arquivoDestino, 'utf8').replaceAll('\r\n', '\n') !==
    conteudoGerado.replaceAll('\r\n', '\n')
  )
    throw new Error('DTOs gerados desatualizados');
} else writeFileSync(arquivoDestino, conteudoGerado);
