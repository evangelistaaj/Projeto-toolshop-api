import type { APIRequestContext } from '@playwright/test';
import { contaAdmin } from './contas';
import { lerDados } from './dados';

export type DadosProduto = {
  name: string;
  description: string;
  price: number;
  category_id: string;
  brand_id: string;
  product_image_id: string;
  is_location_offer: boolean;
  is_rental: boolean;
  co2_rating: string;
  // Não está documentado no Swagger, mas a API aceita-o (e o código-fonte confirma).
  stock?: number;
};

// Vai buscar o primeiro elemento de uma lista da API (categorias, marcas, imagens).
async function primeiroId(api: APIRequestContext, caminho: string): Promise<string> {
  const resposta = await api.get(caminho);
  if (!resposta.ok()) {
    throw new Error(`Não foi possível obter ${caminho} (HTTP ${resposta.status()})`);
  }
  const lista = await resposta.json();
  return lista[0].id;
}

// Produtos do catálogo usados como massa de teste (dados/produtos.json).
// Em inglês, como o resto do catálogo da Toolshop.
const PRODUTOS = lerDados<{ nome: string; descricao: string }[]>('produtos.json');

// Uma referência única, como as de um catálogo real (ex.: "MHO7X2K9A3F").
function referenciaUnica(): string {
  return (Date.now().toString(36) + Math.random().toString(36).slice(2, 5)).toUpperCase();
}

// Dados válidos para criar um produto: um produto do catálogo, ao acaso, com uma
// referência única no nome. Os ids vêm da API, porque mudam sempre que se repõem
// os dados. Os campos do cenário substituem os de omissão.
export async function dadosDeProdutoValidos(
  api: APIRequestContext,
  alteracoes: Partial<DadosProduto> = {},
): Promise<DadosProduto> {
  const produto = PRODUTOS[Math.floor(Math.random() * PRODUTOS.length)];
  return {
    // Nome único: o email de confirmação é encontrado pelos nomes dos produtos.
    name: `${produto.nome} - ref. ${referenciaUnica()}`,
    // Se o cenário der outro nome, a descrição do catálogo deixaria de lhe corresponder.
    description: alteracoes.name ? 'Tool from the Toolshop catalog.' : produto.descricao,
    price: 9.99,
    category_id: await primeiroId(api, '/categories'),
    brand_id: await primeiroId(api, '/brands'),
    product_image_id: await primeiroId(api, '/images'),
    is_location_offer: false,
    is_rental: false,
    co2_rating: 'A',
    ...alteracoes,
  };
}

// Limpeza: apaga os produtos criados num cenário. Faz o seu próprio login de
// administrador, para funcionar mesmo que o cenário não tenha sessão iniciada.
export async function apagarProdutos(api: APIRequestContext, ids: string[]) {
  const login = await api.post('/users/login', { data: contaAdmin });
  const { access_token } = await login.json();
  for (const id of ids) {
    const resposta = await api.delete(`/products/${id}`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    // 409: o produto já foi comprado (está numa fatura) e não pode ser apagado.
    // Fica na base de dados até ao próximo "npm run db:reset".
    if (![204, 404, 409].includes(resposta.status())) {
      console.warn(`Limpeza: não foi possível apagar o produto ${id} (HTTP ${resposta.status()})`);
    }
  }
}