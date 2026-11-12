import { When, Then } from '@cucumber/cucumber';
import type { MundoToolshop } from '../support/world';
import { expect } from '@playwright/test';

When('consulto o catálogo de produtos', async function (this: MundoToolshop) {
  this.resposta = await this.api.get('/products');
});

Then('recebo uma lista de produtos', async function (this: MundoToolshop) {
  if (!this.resposta) {
    throw new Error('Este passo precisa de um "Quando" que faça um pedido antes.');
  }

  // 1. Código HTTP (em caso de falha, a mensagem mostra o corpo da resposta)
  expect(this.resposta.status(), await this.resposta.text()).toBe(200);

  // 2. Forma: os produtos vêm dentro de "data", numa resposta paginada
  const corpo = await this.resposta.json();
  expect(Array.isArray(corpo.data), 'o campo "data" deve ser uma lista').toBe(true);
  expect(corpo.data.length, 'a lista não deve vir vazia').toBeGreaterThan(0);

  // 3. Valores: cada produto tem os campos essenciais, com o tipo certo
  for (const produto of corpo.data) {
    expect(produto).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        name: expect.any(String),
        price: expect.any(Number),
        in_stock: expect.any(Boolean),
      }),
    );
  }
});