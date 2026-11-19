import { expect } from '@playwright/test';
import type { MundoToolshop } from './world';
import { cabecalhosDeAutenticacao } from './autenticacao';
import { corpoSeguro } from './seguranca';

// A fatura da compra do cenário, consultada à parte (como cliente).
// Confirma primeiro que a compra foi aceite: sem fatura, não há nada a verificar.
export async function faturaDaCompra(mundo: MundoToolshop) {
  if (!mundo.resposta) {
    throw new Error('Este passo precisa de uma compra antes ("Quando finalizo a compra").');
  }
  expect(mundo.resposta.status(), await corpoSeguro(mundo.resposta)).toBe(201);
  const consulta = await mundo.api.get(`/invoices/${mundo.faturaId}`, {
    headers: cabecalhosDeAutenticacao(mundo),
  });
  expect(consulta.status(), await corpoSeguro(consulta)).toBe(200);
  return consulta.json();
}

// Subtotal esperado de um carrinho com vários produtos: soma de preço × quantidade.
export function subtotalDoCarrinho(mundo: MundoToolshop): number {
  if (!mundo.produtosNoCarrinho) {
    throw new Error('Este passo precisa de um carrinho com vários produtos ("que tenho no carrinho os produtos:").');
  }
  return mundo.produtosNoCarrinho.reduce((soma, p) => soma + p.preco * p.quantidade, 0);
}

// Um pagamento: o método e os dados que esse método pede.
export type Pagamento = { metodo: string; detalhes: Record<string, unknown> };

// Pagamento na entrega: não precisa de dados. É o que usam os cenários
// em que o pagamento não é o que está a ser testado.
const CONTRA_REEMBOLSO: Pagamento = { metodo: 'cash-on-delivery', detalhes: {} };

// A morada que o cliente está a preencher no cenário.
export function moradaIndicada(mundo: MundoToolshop): Record<string, string> {
  if (!mundo.moradaDaFatura) {
    throw new Error('Este passo precisa de uma morada antes ("que indico a morada sugerida para o código postal ...").');
  }
  return mundo.moradaDaFatura;
}

// Compra o carrinho do cenário com a morada e o pagamento indicados.
export async function comprarCarrinho(
  mundo: MundoToolshop,
  morada: Record<string, string>,
  pagamento: Pagamento = CONTRA_REEMBOLSO,
) {
  if (!mundo.carrinhoId) {
    throw new Error('Este passo precisa de um carrinho com produtos antes.');
  }
  mundo.moradaDaFatura = morada;
  mundo.resposta = await mundo.api.post('/invoices', {
    headers: cabecalhosDeAutenticacao(mundo),
    data: {
      ...morada,
      payment_method: pagamento.metodo,
      payment_details: pagamento.detalhes,
      cart_id: mundo.carrinhoId,
    },
  });
  if (mundo.resposta.ok()) {
    mundo.faturaId = (await mundo.resposta.json()).id;
  }
}