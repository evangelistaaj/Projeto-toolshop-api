import type { APIRequestContext } from '@playwright/test';

// Id de um produto do catálogo que esteja em stock.
// Juntá-lo a um carrinho não o altera: o stock só é gasto na compra.
export async function idDeUmProdutoDoCatalogo(api: APIRequestContext): Promise<string> {
  const resposta = await api.get('/products');
  if (!resposta.ok()) {
    throw new Error(`Não foi possível consultar o catálogo (HTTP ${resposta.status()})`);
  }
  const corpo = await resposta.json();
  const produto = corpo.data.find((p: { in_stock: boolean }) => p.in_stock);
  if (!produto) {
    throw new Error('Nenhum produto em stock na primeira página do catálogo.');
  }
  return produto.id;
}

// Limpeza: apaga os carrinhos criados num cenário (não precisa de login).
export async function apagarCarrinhos(api: APIRequestContext, ids: string[]) {
  for (const id of ids) {
    const resposta = await api.delete(`/carts/${id}`);
    if (resposta.status() !== 204 && resposta.status() !== 404) {
      console.warn(`Limpeza: não foi possível apagar o carrinho ${id} (HTTP ${resposta.status()})`);
    }
  }
}