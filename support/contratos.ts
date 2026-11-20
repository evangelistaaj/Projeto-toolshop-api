import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Ajv, type ErrorObject } from 'ajv';
import { normalizar } from './referencia';

// Contratos das respostas: JSON Schema em contratos/*.schema.json, escritos a partir do
// Swagger da Toolshop. Cada ficheiro tem um "$id" (o nome do contrato) e pode usar os
// outros pelo nome (ex.: a fatura usa "produto" nas linhas). Função pura, sem a API:
// testada em testes/unitarios/contratos.test.ts.

const PASTA = join(__dirname, '..', 'contratos');
const ajv = new Ajv({ allErrors: true, verbose: true });
const CONHECIDOS: string[] = [];
for (const ficheiro of readdirSync(PASTA).filter((f) => f.endsWith('.schema.json'))) {
  const contrato = JSON.parse(readFileSync(join(PASTA, ficheiro), 'utf8'));
  ajv.addSchema(contrato);
  CONHECIDOS.push(contrato.$id);
}

// Nome do Gherkin → nome do contrato: "página de produtos" → "pagina-de-produtos"
function idDoContrato(nome: string): string {
  return normalizar(nome).replace(/\s+/g, '-');
}

const tipoDe = (valor: unknown) => (valor === null ? 'null' : Array.isArray(valor) ? 'array' : typeof valor);

// Uma frase por desvio, a apontar o campo (sem mostrar valores: podem ser dados pessoais).
function descrever(erro: ErrorObject): string {
  const onde = erro.instancePath || '(raiz)';
  switch (erro.keyword) {
    case 'required':
      return `${onde}: falta o campo "${(erro.params as { missingProperty: string }).missingProperty}"`;
    case 'type':
      return `${onde}: devia ser ${[(erro.params as { type: string | string[] }).type].flat().join(' ou ')}, veio ${tipoDe(erro.data)}`;
    case 'not':
      return `${onde}: tem um campo que nunca devia vir (ver o "not" do contrato)`;
    default:
      return `${onde}: ${erro.message}`;
  }
}

// Os desvios de uma resposta em relação ao contrato. Os desvios repetidos em vários
// elementos de uma lista aparecem uma vez, com o número de repetições:
// "/data/*/brand: falta o campo "slug" (9×)".
export function desviosDoContrato(nome: string, corpo: unknown): string[] {
  const validar = ajv.getSchema(idDoContrato(nome));
  if (!validar) {
    throw new Error(`Contrato "${nome}" desconhecido. Contratos em contratos/: ${CONHECIDOS.join(', ')}`);
  }
  if (validar(corpo)) return [];
  const contagem = new Map<string, number>();
  for (const erro of validar.errors ?? []) {
    const frase = descrever({ ...erro, instancePath: erro.instancePath.replace(/\/\d+(?=\/|$)/g, '/*') });
    contagem.set(frase, (contagem.get(frase) ?? 0) + 1);
  }
  return [...contagem].map(([frase, vezes]) => (vezes > 1 ? `${frase} (${vezes}×)` : frase));
}
