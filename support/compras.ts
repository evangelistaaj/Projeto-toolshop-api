import { expect } from '@playwright/test';
import type { MundoToolshop } from './world';
import { tokenDeAdministrador } from './autenticacao';
import { dadosDeProdutoValidos } from './produtos';
import { corpoSeguro } from './seguranca';

// Uma fatura criada por um cenário: o id (para a consultar) e o número (para o PDF).
export type FaturaCriada = { id: string; numero: string };

// Uma compra completa feita com o token indicado (de qualquer cliente), sem mexer
// na sessão do cenário: produto novo (criado pelo administrador), carrinho com 1
// unidade, morada sugerida para 1000-001 (Portugal) e pagamento na entrega.
// Os produtos e carrinhos ficam registados para a limpeza no After.
export async function compraFeitaCom(mundo: MundoToolshop, token: string): Promise<FaturaCriada> {
  const tokenAdmin = await tokenDeAdministrador(mundo.api);
  const criacao = await mundo.api.post('/products', {
    data: await dadosDeProdutoValidos(mundo.api, { stock: 5 }),
    headers: { Authorization: `Bearer ${tokenAdmin}` },
  });
  expect(criacao.status(), await corpoSeguro(criacao)).toBe(201);
  const produtoId = (await criacao.json()).id;
  mundo.produtosCriados.push(produtoId);

  const carrinho = await mundo.api.post('/carts');
  expect(carrinho.status(), await corpoSeguro(carrinho)).toBe(201);
  const carrinhoId = (await carrinho.json()).id;
  mundo.carrinhosCriados.push(carrinhoId);
  const juntar = await mundo.api.post(`/carts/${carrinhoId}`, { data: { product_id: produtoId, quantity: 1 } });
  expect(juntar.status(), await corpoSeguro(juntar)).toBe(200);

  const pesquisa = await mundo.api.get('/postcode-lookup', {
    params: { country: 'PT', postcode: '1000-001', house_number: '1' },
  });
  expect(pesquisa.status(), await corpoSeguro(pesquisa)).toBe(200);
  const morada = await pesquisa.json();

  const compra = await mundo.api.post('/invoices', {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      billing_street: `${morada.street} ${morada.house_number}`,
      billing_city: morada.city,
      // A pesquisa devolve o distrito vazio em Portugal (issue #2): indicamo-lo nós.
      billing_state: 'Lisboa',
      billing_country: 'PT',
      billing_postal_code: '1000-001',
      payment_method: 'cash-on-delivery',
      payment_details: {},
      cart_id: carrinhoId,
    },
  });
  expect(compra.status(), await corpoSeguro(compra)).toBe(201);
  const fatura = await compra.json();
  return { id: fatura.id, numero: fatura.invoice_number };
}
