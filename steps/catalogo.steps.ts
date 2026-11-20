import { When, Then } from '@cucumber/cucumber';
import type { MundoToolshop } from '../support/world';
import { expect } from '@playwright/test';
import { repetidos } from '../support/oraculos';

When('consulto o catálogo de produtos',
  async function (this: MundoToolshop) {
    this.resposta = await this.api.get('/products');
  });

Then('recebo uma lista de produtos',
  async function (this: MundoToolshop) {
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

// ---------- Paginação ----------
// A API devolve 9 produtos por página, com a posição no catálogo ("from" e "to"),
// o total de produtos e o número da última página. Os oráculos usam o total e a
// última página que a própria resposta indica: o catálogo da Toolshop local e o da
// API pública têm tamanhos diferentes, e mudam com o tempo.

// Ordens do Gherkin → parâmetro "sort" da API
const ORDENS: Record<string, string | undefined> = {
  'por omissão': undefined,
  'nome crescente': 'name,asc',
  'preço decrescente': 'price,desc',
};

async function pagina(mundo: MundoToolshop, numero: number, sort?: string) {
  const params: Record<string, string | number> = { page: numero };
  if (sort) params.sort = sort;
  const resposta = await mundo.api.get('/products', { params });
  expect(resposta.status(), await resposta.text()).toBe(200);
  return { resposta, corpo: await resposta.json() };
}

// Um produto qualquer do catálogo (o primeiro da primeira página), pelo endereço do produto
When('consulto um produto do catálogo',
  async function (this: MundoToolshop) {
    const { corpo } = await pagina(this, 1);
    expect(corpo.data.length, 'o catálogo devia ter produtos').toBeGreaterThan(0);
    this.resposta = await this.api.get(`/products/${corpo.data[0].id}`);
  });

When('consulto a página {int} do catálogo',
  async function (this: MundoToolshop, numero: number) {
    this.resposta = await this.api.get('/products', { params: { page: numero } });
  });

When('consulto a página a seguir à última do catálogo',
  async function (this: MundoToolshop) {
    const { corpo } = await pagina(this, 1);
    this.resposta = await this.api.get('/products', { params: { page: corpo.last_page + 1 } });
  });

When('percorro todas as páginas do catálogo, com a ordem {string}',
  async function (this: MundoToolshop, ordem: string) {
    if (!(ordem in ORDENS)) {
      throw new Error(`Ordem desconhecida: "${ordem}". Conhecidas: ${Object.keys(ORDENS).join(', ')}`);
    }
    const sort = ORDENS[ordem];
    // O total e a última página vêm da primeira resposta. O percurso é rápido, mas na
    // API pública outras pessoas podem criar produtos entretanto; nesse caso raro, o
    // total muda e o cenário falha com os números à vista.
    const primeira = await pagina(this, 1, sort);
    this.totalDoCatalogo = primeira.corpo.total;
    this.produtosPercorridos = primeira.corpo.data.map((p: { id: string }) => p.id);
    for (let numero = 2; numero <= primeira.corpo.last_page; numero++) {
      const { corpo } = await pagina(this, numero, sort);
      this.produtosPercorridos.push(...corpo.data.map((p: { id: string }) => p.id));
    }
  });

Then('a página {int} tem {int} produtos, do {int}.º ao {int}.º',
  async function (this: MundoToolshop, numero: number, quantidade: number, de: number, ate: number) {
    expect(this.resposta!.status(), await this.resposta!.text()).toBe(200);
    const corpo = await this.resposta!.json();
    expect(corpo.current_page, 'página devolvida').toBe(numero);
    expect(corpo.per_page, 'produtos por página').toBe(quantidade);
    expect(corpo.data.length, 'produtos recebidos').toBe(quantidade);
    expect({ from: corpo.from, to: corpo.to }, 'posição no catálogo').toEqual({ from: de, to: ate });
  });

Then('a página vem vazia',
  async function (this: MundoToolshop) {
    expect(this.resposta!.status(), await this.resposta!.text()).toBe(200);
    const corpo = await this.resposta!.json();
    expect(corpo.current_page, 'deve ser a página pedida, depois da última').toBe(corpo.last_page + 1);
    expect(corpo.data, 'produtos').toEqual([]);
    expect({ from: corpo.from, to: corpo.to }, 'posição no catálogo').toEqual({ from: null, to: null });
  });

Then('recebo cada produto do catálogo uma só vez',
  async function (this: MundoToolshop) {
    const ids = this.produtosPercorridos;
    expect(ids.length, 'produtos recebidos = total que a API indicou').toBe(this.totalDoCatalogo);
    expect(repetidos(ids), 'produtos repetidos entre páginas').toEqual([]);
  });
