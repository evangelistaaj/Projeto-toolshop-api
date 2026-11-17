import { When, Then, DataTable } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import type { MundoToolshop } from '../support/world';
import { cabecalhosDeAutenticacao } from '../support/autenticacao';
import { dadosDeProdutoValidos } from '../support/produtos';
import { corpoSeguro } from '../support/seguranca';

When('crio um produto com os dados:', async function (this: MundoToolshop, tabela: DataTable) {
  // Tabela de duas colunas (campo | valor), em linguagem do negócio.
  const campos = tabela.rowsHash();
  this.dadosEnviados = await dadosDeProdutoValidos(this.api, {
    name: campos['nome'],
    price: Number(campos['preço']),
  });

  this.resposta = await this.api.post('/products', {
    data: this.dadosEnviados,
    headers: cabecalhosDeAutenticacao(this),
  });

  // Se foi criado (seja qual for o código de sucesso), regista-o para a limpeza.
  if (this.resposta.ok()) {
    const corpo = await this.resposta.json();
    this.produtoId = corpo.id;
    this.produtosCriados.push(corpo.id);
  }
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