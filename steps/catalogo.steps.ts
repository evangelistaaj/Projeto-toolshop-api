import { When, Then } from '@cucumber/cucumber';
import type { MundoToolshop } from '../support/world';
import { expect } from '@playwright/test';
import { repetidos, foraDeOrdem, diferencas } from '../support/oraculos';
import { ordemPeloNome, todasAsPaginas, catalogoCompleto, idDaCategoria, idDaMarca, type ProdutoDoCatalogo } from '../support/catalogo';

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
    const { sort } = ordemPeloNome(ordem);
    // O total e a última página vêm da primeira resposta. O percurso é rápido, mas na
    // API pública outras pessoas podem criar produtos entretanto; nesse caso raro, o
    // total muda e o cenário falha com os números à vista.
    const primeira = await pagina(this, 1, sort);
    this.totalDoCatalogo = primeira.corpo.total;
    this.produtosPercorridos = primeira.corpo.data.map((p: { id: string }) => p.id);
    this.produtosRecebidos = [...primeira.corpo.data];
    for (let numero = 2; numero <= primeira.corpo.last_page; numero++) {
      const { corpo } = await pagina(this, numero, sort);
      this.produtosPercorridos.push(...corpo.data.map((p: { id: string }) => p.id));
      this.produtosRecebidos.push(...corpo.data);
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

// ---------- Pesquisa e filtros ----------
// Oráculo: o catálogo completo, percorrido à parte, filtrado aqui com a regra do cenário.
// A API tem de devolver exatamente esses produtos, nem mais nem menos. Assim os cenários
// não dependem de listas fixas, e servem para a Toolshop local e para a API pública.
// Regras confirmadas na Toolshop: a pesquisa procura só no nome, sem distinguir
// maiúsculas, e aceita parte de uma palavra; inclui os alugueres, que o catálogo esconde
// por omissão; os limites do preço são inclusivos.

const contem = (nome: string, termo: string) => nome.toLowerCase().includes(termo.toLowerCase());

When('pesquiso no catálogo por {string}',
  async function (this: MundoToolshop, termo: string) {
    this.produtosRecebidos = await todasAsPaginas(this.api, '/products/search', { q: termo });
    this.filtro = { descricao: `nome contém "${termo}"`, cumpre: (p) => contem(p.name, termo), comAlugueres: true };
  });

When('filtro o catálogo pela categoria {string}',
  async function (this: MundoToolshop, categoria: string) {
    const id = await idDaCategoria(this.api, categoria);
    this.produtosRecebidos = await todasAsPaginas(this.api, '/products', { by_category: id });
    this.filtro = { descricao: `categoria ${categoria}`, cumpre: (p) => p.category.id === id, comAlugueres: false };
  });

When('filtro o catálogo pela marca {string}',
  async function (this: MundoToolshop, marca: string) {
    const id = await idDaMarca(this.api, marca);
    this.produtosRecebidos = await todasAsPaginas(this.api, '/products', { by_brand: id });
    this.filtro = { descricao: `marca ${marca}`, cumpre: (p) => p.brand.id === id, comAlugueres: false };
  });

When('filtro o catálogo por preço entre {float} e {float}',
  async function (this: MundoToolshop, minimo: number, maximo: number) {
    this.produtosRecebidos = await todasAsPaginas(this.api, '/products', { between: `price,${minimo},${maximo}` });
    this.filtro = {
      descricao: `preço entre ${minimo} e ${maximo}, limites incluídos`,
      cumpre: (p) => p.price >= minimo && p.price <= maximo,
      comAlugueres: false,
    };
  });

When('filtro o catálogo pela categoria {string}, pela marca {string} e por preço entre {float} e {float}, com a ordem {string}',
  async function (this: MundoToolshop, categoria: string, marca: string, minimo: number, maximo: number, nomeDaOrdem: string) {
    const [idCategoria, idMarca] = [await idDaCategoria(this.api, categoria), await idDaMarca(this.api, marca)];
    const { sort } = ordemPeloNome(nomeDaOrdem);
    this.produtosRecebidos = await todasAsPaginas(this.api, '/products', {
      by_category: idCategoria,
      by_brand: idMarca,
      between: `price,${minimo},${maximo}`,
      ...(sort ? { sort } : {}),
    });
    this.filtro = {
      descricao: `categoria ${categoria}, marca ${marca} e preço entre ${minimo} e ${maximo}`,
      cumpre: (p) => p.category.id === idCategoria && p.brand.id === idMarca && p.price >= minimo && p.price <= maximo,
      comAlugueres: false,
    };
  });

When('consulto os produtos de aluguer',
  async function (this: MundoToolshop) {
    this.produtosRecebidos = await todasAsPaginas(this.api, '/products', { is_rental: 'true' });
  });

Then('recebo exatamente os produtos do catálogo que cumprem o filtro',
  async function (this: MundoToolshop) {
    if (!this.filtro) throw new Error('Este passo precisa de um "Quando" que pesquise ou filtre o catálogo.');
    const esperados = (await catalogoCompleto(this.api, this.filtro.comAlugueres)).filter(this.filtro.cumpre);
    // Sem produtos esperados, o cenário não provaria nada: os dados de demonstração mudaram?
    expect(esperados.length, `o catálogo devia ter produtos com ${this.filtro.descricao}`).toBeGreaterThan(0);
    const nomes = (ids: string[], lista: ProdutoDoCatalogo[]) => ids.map((id) => lista.find((p) => p.id === id)!.name);
    const { aMais, emFalta } = diferencas(this.produtosRecebidos.map((p) => p.id), esperados.map((p) => p.id));
    expect(
      { aMais: nomes(aMais, this.produtosRecebidos), emFalta: nomes(emFalta, esperados) },
      `produtos com ${this.filtro.descricao}`,
    ).toEqual({ aMais: [], emFalta: [] });
    expect(repetidos(this.produtosRecebidos.map((p) => p.id)), 'produtos repetidos entre páginas').toEqual([]);
  });

Then('não recebo nenhum produto',
  async function (this: MundoToolshop) {
    expect(this.produtosRecebidos.map((p) => p.name), 'produtos recebidos').toEqual([]);
  });

Then('os produtos vêm ordenados por {string}',
  async function (this: MundoToolshop, nomeDaOrdem: string) {
    const { criterio, sentido } = ordemPeloNome(nomeDaOrdem);
    if (!criterio || !sentido) throw new Error(`"${nomeDaOrdem}" não é uma ordem que se possa verificar.`);
    expect(this.produtosRecebidos.length, 'produtos recebidos').toBeGreaterThan(1);
    expect(foraDeOrdem(this.produtosRecebidos, criterio, sentido), `pares fora da ordem "${nomeDaOrdem}"`).toEqual([]);
  });

Then('nenhum produto é de aluguer',
  async function (this: MundoToolshop) {
    const alugueres = this.produtosRecebidos.filter((p) => p.is_rental).map((p) => p.name);
    expect(this.produtosRecebidos.length, 'produtos recebidos').toBeGreaterThan(0);
    expect(alugueres, 'produtos de aluguer no catálogo').toEqual([]);
  });

Then('todos os produtos recebidos são de aluguer',
  async function (this: MundoToolshop) {
    const deVenda = this.produtosRecebidos.filter((p) => !p.is_rental).map((p) => p.name);
    expect(this.produtosRecebidos.length, 'produtos de aluguer recebidos').toBeGreaterThan(0);
    expect(deVenda, 'produtos de venda entre os alugueres').toEqual([]);
  });

// ---------- Pedidos inválidos ----------
// O contrato (Swagger) diz o que cada parâmetro aceita; um valor fora disso é um erro de
// quem pede e deve ser recusado com 422, como no resto da API.
When('consulto {string} com {string}',
  async function (this: MundoToolshop, endereco: string, parametros: string) {
    this.resposta = await this.api.get(`${endereco}?${parametros}`);
  });
