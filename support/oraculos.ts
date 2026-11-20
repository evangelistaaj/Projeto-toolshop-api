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
