// Verificações (oráculos) usadas pelos passos, separadas do Cucumber e do Playwright
// para poderem ser testadas sozinhas, com dados inventados (testes/unitarios/oraculos.test.ts).
// Um oráculo que nunca falha não protege nada: os testes unitários provam que estes falham
// quando devem.

// Campos (a qualquer profundidade) cujo nome corresponde ao padrão, com o caminho e o valor.
export function camposComNome(valor: unknown, padrao: RegExp, caminho = 'fatura'): { caminho: string; valor: unknown }[] {
  if (valor === null || typeof valor !== 'object') {
    return [];
  }
  return Object.entries(valor).flatMap(([nome, filho]) => [
    ...(padrao.test(nome) ? [{ caminho: `${caminho}.${nome}`, valor: filho }] : []),
    ...camposComNome(filho, padrao, `${caminho}.${nome}`),
  ]);
}

// Caminhos dos valores (a qualquer profundidade) que contêm algum dos textos procurados.
// Devolve só os caminhos, para as mensagens de falha nunca mostrarem o dado sensível.
export function caminhosQueContem(valor: unknown, procurados: string[], caminho = 'fatura'): string[] {
  if (typeof valor === 'string' || typeof valor === 'number') {
    return procurados.some((p) => String(valor).includes(p)) ? [caminho] : [];
  }
  if (valor === null || typeof valor !== 'object') {
    return [];
  }
  return Object.entries(valor).flatMap(([nome, filho]) => caminhosQueContem(filho, procurados, `${caminho}.${nome}`));
}

// Os elementos que aparecem mais do que uma vez (cada repetição conta).
export function repetidos<T>(lista: T[]): T[] {
  return lista.filter((elemento, i) => lista.indexOf(elemento) !== i);
}

// ---------- Catálogo ----------

export type Criterio = 'nome' | 'preço';
export type Sentido = 'crescente' | 'decrescente';

// Os pares de vizinhos fora de ordem ("anterior > seguinte"). Produtos com o mesmo valor
// podem vir em qualquer ordem. Nomes: sem distinguir maiúsculas, com as regras do inglês
// (como a base de dados da Toolshop: "Claw Hammer" vem antes de "claw hammer with...").
export function foraDeOrdem(
  produtos: { name: string; price: number }[],
  criterio: Criterio,
  sentido: Sentido,
): string[] {
  const comparar = (a: { name: string; price: number }, b: { name: string; price: number }) =>
    criterio === 'preço' ? a.price - b.price : a.name.toLowerCase().localeCompare(b.name.toLowerCase(), 'en');
  const fatores = sentido === 'crescente' ? 1 : -1;
  const pares: string[] = [];
  for (let i = 1; i < produtos.length; i++) {
    if (comparar(produtos[i - 1], produtos[i]) * fatores > 0) {
      const valor = (p: { name: string; price: number }) => (criterio === 'preço' ? `${p.name} (${p.price})` : p.name);
      pares.push(`${valor(produtos[i - 1])} antes de ${valor(produtos[i])}`);
    }
  }
  return pares;
}

// O que uma lista tem a mais e o que lhe falta em relação à esperada (a ordem não conta).
export function diferencas<T>(recebidos: T[], esperados: T[]): { aMais: T[]; emFalta: T[] } {
  return {
    aMais: recebidos.filter((x) => !esperados.includes(x)),
    emFalta: esperados.filter((x) => !recebidos.includes(x)),
  };
}
