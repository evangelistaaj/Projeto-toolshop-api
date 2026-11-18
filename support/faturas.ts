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
