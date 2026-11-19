import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Massa de teste: dados de negócio em ficheiros JSON na pasta dados/, separados do código.
// Para mudar um produto, um país ou os dados de um pagamento, basta editar o ficheiro.
export function lerDados<T>(ficheiro: string): T {
  const caminho = join(__dirname, '..', 'dados', ficheiro);
  try {
    return JSON.parse(readFileSync(caminho, 'utf8')) as T;
  } catch (erro) {
    throw new Error(`Não foi possível ler a massa de teste ${caminho}: ${(erro as Error).message}`);
  }
}
