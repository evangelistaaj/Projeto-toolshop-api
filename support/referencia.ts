import { lerDados } from './dados';

// Divisão política oficial da Argentina: 23 províncias e a Cidade Autónoma
// de Buenos Aires (dados/provincias-argentina.json).
export const PROVINCIAS_ARGENTINA = lerDados<string[]>('provincias-argentina.json');

// Normaliza um texto para comparação: sem acentos, sem espaços nas pontas
// e em minúsculas. Assim, "Córdoba", "Cordoba" e "córdoba " contam como iguais.
export function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
}

// Países usados nos cenários e o código ISO que a API espera (dados/paises.json).
// Os cenários falam em "Portugal"; a API recebe "PT".
const PAISES = lerDados<Record<string, string>>('paises.json');

// Código ISO de um país. Um nome desconhecido faz falhar o teste,
// em vez de enviar à API um valor inventado.
export function codigoDoPais(nome: string): string {
  const codigo = PAISES[nome];
  if (!codigo) {
    throw new Error(`O país "${nome}" não tem código definido em dados/paises.json`);
  }
  return codigo;
}