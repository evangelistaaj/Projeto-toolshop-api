import { Given, When, Then, DataTable } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import type { MundoToolshop } from '../support/world';
import { cabecalhosDeAutenticacao } from '../support/autenticacao';
import { dadosDeProdutoValidos, type DadosProduto } from '../support/produtos';
import { corpoSeguro } from '../support/seguranca';


// Cria um produto e regista-o para a limpeza no After.
// Partilhada pelo "Quando crio um produto" e pelo "Dado que existe um produto".
async function criarProduto(mundo: MundoToolshop, alteracoes: Partial<DadosProduto> = {}) {
  mundo.dadosEnviados = await dadosDeProdutoValidos(mundo.api, alteracoes);
  mundo.resposta = await mundo.api.post('/products', {
    data: mundo.dadosEnviados,
    headers: cabecalhosDeAutenticacao(mundo),
  });
  if (mundo.resposta.ok()) {
    const corpo = await mundo.resposta.json();
    mundo.produtoId = corpo.id;
    mundo.produtosCriados.push(corpo.id);
  }
}

When('crio um produto com os dados:', async function (this: MundoToolshop, tabela: DataTable) {
  // Tabela de duas colunas (campo | valor), em linguagem do negócio.
  const campos = tabela.rowsHash();
  await criarProduto(this, { name: campos['nome'], price: Number(campos['preço']) });
});

Then('o produto fica disponível no catálogo com esses dados', async function (this: MundoToolshop) {
  if (!this.resposta || !this.dadosEnviados) {
    throw new Error('Este passo precisa de um "Quando" que crie um produto antes.');
  }

  // 1. Código da criação. Fonte: convenção REST (201 Created para um recurso novo).
  //    Atenção: o Swagger documenta 200. Se falhar aqui, investigamos antes de mudar.
  expect(this.resposta.status(), await corpoSeguro(this.resposta)).toBe(201);
  expect(this.produtoId, 'a criação deve devolver o id do produto').toEqual(expect.any(String));

  // 2. O produto existe mesmo: consultamo-lo à parte, com um pedido novo.
  const consulta = await this.api.get(`/products/${this.produtoId}`);
  expect(consulta.status(), await corpoSeguro(consulta)).toBe(200);

  // 3. E ficou com os dados que enviámos.
  const produto = await consulta.json();
  expect(produto.name, 'nome do produto').toBe(this.dadosEnviados.name);
  expect(produto.price, 'preço do produto').toBe(this.dadosEnviados.price);
});

Given('que existe um produto criado por mim', async function (this: MundoToolshop) {
  await criarProduto(this);
  // Pré-condição: se a criação falhar, o cenário pára aqui, com a causa.
  expect(this.resposta!.status(), await corpoSeguro(this.resposta!)).toBe(201);
});

When('altero o preço do produto para {float}', async function (this: MundoToolshop, preco: number) {
  if (!this.produtoId || !this.dadosEnviados) {
    throw new Error('Este passo precisa de um produto criado antes ("que existe um produto criado por mim").');
  }
  // O PUT substitui o produto inteiro: enviamos todos os dados, só com o preço novo.
  this.dadosEnviados = { ...this.dadosEnviados, price: preco };
  this.resposta = await this.api.put(`/products/${this.produtoId}`, {
    data: this.dadosEnviados,
    headers: cabecalhosDeAutenticacao(this),
  });
});

Then('o produto passa a ter o preço {float}', async function (this: MundoToolshop, preco: number) {
  if (!this.resposta || !this.produtoId) {
    throw new Error('Este passo precisa de uma alteração de produto antes.');
  }
  // Fonte: Swagger ("Result of the update", 200), igual à convenção REST.
  expect(this.resposta.status(), await corpoSeguro(this.resposta)).toBe(200);

  const consulta = await this.api.get(`/products/${this.produtoId}`);
  expect(consulta.status(), await corpoSeguro(consulta)).toBe(200);
  const produto = await consulta.json();
  expect(produto.price, 'preço do produto').toBe(preco);
});

When('apago o produto', async function (this: MundoToolshop) {
  if (!this.produtoId) {
    throw new Error('Este passo precisa de um produto criado antes ("que existe um produto criado por mim").');
  }
  this.resposta = await this.api.delete(`/products/${this.produtoId}`, {
    headers: cabecalhosDeAutenticacao(this),
  });
});

Then('o produto deixa de existir no catálogo', async function (this: MundoToolshop) {
  if (!this.resposta || !this.produtoId) {
    throw new Error('Este passo precisa de um "Quando" que apague um produto antes.');
  }
  // Fonte: Swagger (204, "Successful operation"), igual à convenção REST.
  expect(this.resposta.status(), await corpoSeguro(this.resposta)).toBe(204);

  const consulta = await this.api.get(`/products/${this.produtoId}`);
  expect(consulta.status(), 'o produto apagado já não deve existir').toBe(404);
});

When('consulto um produto que não existe', async function (this: MundoToolshop) {
  // Id com o formato certo (ULID, 26 caracteres), mas que não existe nos dados.
  this.resposta = await this.api.get('/products/01ZZZZZZZZZZZZZZZZZZZZZZZZ');
});