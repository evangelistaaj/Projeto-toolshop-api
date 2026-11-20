import { expect, type APIRequestContext } from '@playwright/test';
import type { Criterio, Sentido } from './oraculos';

// Um produto como o catálogo o devolve (só os campos que os oráculos usam).
export type ProdutoDoCatalogo = {
  id: string;
  name: string;
  price: number;
  is_rental: boolean;
  category: { id: string; name: string };
  brand: { id: string; name: string };
};

// Ordens do Gherkin → parâmetro "sort" da API, e como as verificar.
export const ORDENS: Record<string, { sort?: string; criterio?: Criterio; sentido?: Sentido }> = {
  'por omissão': {},
  'nome crescente': { sort: 'name,asc', criterio: 'nome', sentido: 'crescente' },
  'nome decrescente': { sort: 'name,desc', criterio: 'nome', sentido: 'decrescente' },
  'preço crescente': { sort: 'price,asc', criterio: 'preço', sentido: 'crescente' },
  'preço decrescente': { sort: 'price,desc', criterio: 'preço', sentido: 'decrescente' },
};

export function ordemPeloNome(nome: string) {
  const encontrada = ORDENS[nome];
  if (!encontrada) throw new Error(`Ordem desconhecida: "${nome}". Conhecidas: ${Object.keys(ORDENS).join(', ')}`);
  return encontrada;
}

// Todas as páginas de uma consulta ao catálogo (/products ou /products/search), juntas.
// A última página vem da primeira resposta.
export async function todasAsPaginas(
  api: APIRequestContext,
  endereco: string,
  params: Record<string, string> = {},
): Promise<ProdutoDoCatalogo[]> {
  const pagina = async (numero: number) => {
    const resposta = await api.get(endereco, { params: { ...params, page: numero } });
    expect(resposta.status(), `${endereco} ${JSON.stringify(params)}: ${await resposta.text()}`).toBe(200);
    return resposta.json();
  };
  const primeira = await pagina(1);
  const produtos: ProdutoDoCatalogo[] = [...primeira.data];
  for (let numero = 2; numero <= primeira.last_page; numero++) produtos.push(...(await pagina(numero)).data);
  return produtos;
}

// O catálogo completo, para os oráculos: os produtos de venda (o que /products mostra por
// omissão) e, se pedido, também os de aluguer (que só aparecem com is_rental=true).
export async function catalogoCompleto(api: APIRequestContext, comAlugueres: boolean) {
  const venda = await todasAsPaginas(api, '/products');
  return comAlugueres ? [...venda, ...(await todasAsPaginas(api, '/products', { is_rental: 'true' }))] : venda;
}

// Ids a partir dos nomes do Gherkin. As categorias vêm em árvore (mãe → subcategorias).
export async function idDaCategoria(api: APIRequestContext, nome: string): Promise<string> {
  const resposta = await api.get('/categories/tree');
  expect(resposta.status(), await resposta.text()).toBe(200);
  type No = { id: string; name: string; sub_categories?: No[] };
  const procurar = (nos: No[]): string | undefined => {
    for (const no of nos) {
      if (no.name === nome) return no.id;
      const dentro = procurar(no.sub_categories ?? []);
      if (dentro) return dentro;
    }
  };
  const id = procurar(await resposta.json());
  if (!id) throw new Error(`Categoria "${nome}" não existe na Toolshop.`);
  return id;
}

export async function idDaMarca(api: APIRequestContext, nome: string): Promise<string> {
  const resposta = await api.get('/brands');
  expect(resposta.status(), await resposta.text()).toBe(200);
  const marca = (await resposta.json()).find((m: { name: string }) => m.name === nome);
  if (!marca) throw new Error(`Marca "${nome}" não existe na Toolshop.`);
  return marca.id;
}
