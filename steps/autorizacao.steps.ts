import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import type { MundoToolshop } from '../support/world';
import { cabecalhosDeAutenticacao, tokenDeAdministrador } from '../support/autenticacao';
import { compraFeitaCom } from '../support/compras';
import { contaOutroCliente } from '../support/contas';
import { dadosDeClienteValidos } from '../support/clientes';
import { dadosDeProdutoValidos } from '../support/produtos';
import { corpoSeguro } from '../support/seguranca';
import { gerarPdfDaFatura } from '../support/toolshop-local';

// Uma recusa por falta de permissão: 401 (sem sessão), 403 (sem permissão) ou 404
// (a API esconde que o recurso existe, o que também é uma boa prática).
const CODIGOS_DE_RECUSA = [401, 403, 404];

// O estado que uma fatura acabada de criar nunca tem sozinha: o agendador da Toolshop
// (order:update) só a leva até "COMPLETED" em mais de 20 minutos.
const CONCLUIDA = 'COMPLETED';

function faturaDoOutroCliente(mundo: MundoToolshop) {
  if (!mundo.faturaDoOutroCliente || !mundo.tokenDoOutroCliente) {
    throw new Error('Este passo precisa de uma compra do outro cliente antes ("que outro cliente fez uma compra").');
  }
  return mundo.faturaDoOutroCliente;
}

function minhaFatura(mundo: MundoToolshop) {
  if (!mundo.minhaFatura) {
    throw new Error('Este passo precisa de uma compra antes ("que fiz uma compra").');
  }
  return mundo.minhaFatura;
}

// Estado de uma fatura, consultado com o token indicado (o do dono, ou de um administrador).
async function estadoDaFatura(mundo: MundoToolshop, id: string, token: string): Promise<string> {
  const consulta = await mundo.api.get(`/invoices/${id}`, { headers: { Authorization: `Bearer ${token}` } });
  expect(consulta.status(), await corpoSeguro(consulta)).toBe(200);
  return (await consulta.json()).status;
}

// ---------- Preparação ----------

// O outro cliente faz login e compra, sem mexer na sessão do cenário.
Given('que outro cliente fez uma compra', async function (this: MundoToolshop) {
  const login = await this.api.post('/users/login', { data: contaOutroCliente });
  expect(login.status(), `login do outro cliente: ${await corpoSeguro(login)}`).toBe(200);
  this.tokenDoOutroCliente = (await login.json()).access_token;
  this.faturaDoOutroCliente = await compraFeitaCom(this, this.tokenDoOutroCliente!);
});

Given('que fiz uma compra', async function (this: MundoToolshop) {
  if (!this.token) {
    throw new Error('Este passo precisa de uma sessão iniciada antes ("que fiz login como cliente").');
  }
  this.minhaFatura = await compraFeitaCom(this, this.token);
});

// Normalmente o PDF é gerado em segundo plano, pelo agendador, para todas as faturas sem PDF
// de uma vez. Para o cenário não depender disso, geramos já o PDF desta fatura (com o código
// da Toolshop) e confirmamos que o dono o consegue descarregar.
Given('que o PDF da fatura do outro cliente já foi gerado', { timeout: 60_000 }, async function (this: MundoToolshop) {
  const { numero } = faturaDoOutroCliente(this);
  gerarPdfDaFatura(numero);
  const pdf = await this.api.get(`/invoices/${numero}/download-pdf`, {
    headers: { Authorization: `Bearer ${this.tokenDoOutroCliente}` },
  });
  expect(`${pdf.status()} ${pdf.headers()['content-type'] ?? ''}`, 'o dono devia conseguir descarregar o PDF').toMatch(
    /^200 .*pdf/,
  );
});

// Um produto criado pelo administrador, sem iniciar sessão no cenário: assim o
// cenário pode tentar alterá-lo sem login ou com a sessão de um cliente.
Given('que existe um produto na loja', async function (this: MundoToolshop) {
  const token = await tokenDeAdministrador(this.api);
  this.dadosEnviados = await dadosDeProdutoValidos(this.api);
  const criacao = await this.api.post('/products', {
    data: this.dadosEnviados,
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(criacao.status(), await corpoSeguro(criacao)).toBe(201);
  this.produtoId = (await criacao.json()).id;
  this.produtosCriados.push(this.produtoId!);
  this.precoOriginal = this.dadosEnviados.price;
});

// ---------- Ações ----------

When('consulto a minha fatura', async function (this: MundoToolshop) {
  this.resposta = await this.api.get(`/invoices/${minhaFatura(this).id}`, {
    headers: cabecalhosDeAutenticacao(this),
  });
});

When('consulto a fatura do outro cliente', async function (this: MundoToolshop) {
  this.resposta = await this.api.get(`/invoices/${faturaDoOutroCliente(this).id}`, {
    headers: cabecalhosDeAutenticacao(this),
  });
});

When('marco a fatura do outro cliente como concluída', async function (this: MundoToolshop) {
  this.resposta = await this.api.put(`/invoices/${faturaDoOutroCliente(this).id}/status`, {
    headers: cabecalhosDeAutenticacao(this),
    data: { status: CONCLUIDA },
  });
});

When('marco a minha fatura como concluída', async function (this: MundoToolshop) {
  this.resposta = await this.api.put(`/invoices/${minhaFatura(this).id}/status`, {
    headers: cabecalhosDeAutenticacao(this),
    data: { status: CONCLUIDA },
  });
});

When('descarrego o PDF da fatura do outro cliente', async function (this: MundoToolshop) {
  this.resposta = await this.api.get(`/invoices/${faturaDoOutroCliente(this).numero}/download-pdf`, {
    headers: cabecalhosDeAutenticacao(this),
  });
});

// ---------- Resultados ----------

Then(/^a (?:alteração|criação) é recusada$/, async function (this: MundoToolshop) {
  expect(CODIGOS_DE_RECUSA, `código de recusa esperado; veio ${this.resposta!.status()}: ${await corpoSeguro(this.resposta!)}`)
    .toContain(this.resposta!.status());
});

Then('a fatura não me é mostrada', async function (this: MundoToolshop) {
  expect(CODIGOS_DE_RECUSA, `código de recusa esperado; veio ${this.resposta!.status()}`).toContain(
    this.resposta!.status(),
  );
  // Nem o número da fatura pode aparecer na resposta.
  expect(await this.resposta!.text(), 'a resposta não devia conter a fatura do outro cliente').not.toContain(
    faturaDoOutroCliente(this).numero,
  );
});

Then('o PDF não me é entregue', async function (this: MundoToolshop) {
  const tipo = this.resposta!.headers()['content-type'] ?? '';
  expect(CODIGOS_DE_RECUSA, `código de recusa esperado; veio ${this.resposta!.status()} (${tipo})`).toContain(
    this.resposta!.status(),
  );
  expect(tipo, 'a resposta não devia ser um PDF').not.toContain('pdf');
});

// A recusa só conta se nada mudou: confirmamos com o dono da fatura.
Then('a fatura do outro cliente não fica concluída', async function (this: MundoToolshop) {
  const { id } = faturaDoOutroCliente(this);
  expect(await estadoDaFatura(this, id, this.tokenDoOutroCliente!), 'estado da fatura do outro cliente').not.toBe(
    CONCLUIDA,
  );
});

Then('a minha fatura não fica concluída', async function (this: MundoToolshop) {
  expect(await estadoDaFatura(this, minhaFatura(this).id, this.token!), 'estado da minha fatura').not.toBe(CONCLUIDA);
});

Then('o produto mantém o preço', async function (this: MundoToolshop) {
  const consulta = await this.api.get(`/products/${this.produtoId}`);
  expect(consulta.status(), await corpoSeguro(consulta)).toBe(200);
  expect((await consulta.json()).price, 'preço do produto').toBe(this.precoOriginal);
});

Then('o produto continua no catálogo', async function (this: MundoToolshop) {
  const consulta = await this.api.get(`/products/${this.produtoId}`);
  expect(consulta.status(), 'o produto devia continuar a existir').toBe(200);
});

// ---------- Dados de outros clientes ----------
// O outro cliente é uma conta nova, registada no cenário e apagada no fim (hook After),
// para nunca mexer nas contas de demonstração.

function outroCliente(mundo: MundoToolshop) {
  if (!mundo.outroCliente) throw new Error('Este passo precisa de outro cliente antes ("que outro cliente tem conta na loja").');
  return mundo.outroCliente;
}

function comMeuToken(mundo: MundoToolshop) {
  if (!mundo.token) throw new Error('Este passo precisa de uma sessão iniciada antes ("que fiz login como cliente").');
  return { Authorization: `Bearer ${mundo.token}` };
}

Given('que outro cliente tem conta na loja', async function (this: MundoToolshop) {
  await criarOutroCliente(this);
});

// Regista e entra com uma conta nova para o "outro cliente" (apagada no fim, no hook After).
async function criarOutroCliente(mundo: MundoToolshop) {
  const dados = dadosDeClienteValidos();
  const registo = await mundo.api.post('/users/register', { data: dados });
  expect(registo.status(), `registo do outro cliente: ${await corpoSeguro(registo)}`).toBe(201);
  const id = (await registo.json()).id;
  mundo.clientesCriados.push(id);
  const login = await mundo.api.post('/users/login', { data: { email: dados.email, password: dados.password } });
  expect(login.status(), `login do outro cliente: ${await corpoSeguro(login)}`).toBe(200);
  mundo.outroCliente = { id, token: (await login.json()).access_token, dados };
}

When('consulto os dados do outro cliente', async function (this: MundoToolshop) {
  this.resposta = await this.api.get(`/users/${outroCliente(this).id}`, { headers: comMeuToken(this) });
});

When('pesquiso clientes pelo apelido do outro cliente', async function (this: MundoToolshop) {
  this.resposta = await this.api.get('/users/search', {
    params: { q: outroCliente(this).dados.last_name },
    headers: comMeuToken(this),
  });
});

// PUT envia a conta completa com o nome novo; PATCH envia só o nome.
When(/^altero o nome do outro cliente com um pedido (PUT|PATCH)$/, async function (this: MundoToolshop, metodo: string) {
  const { id, dados } = outroCliente(this);
  const corpo = metodo === 'PUT' ? { ...dados, first_name: 'Alterado' } : { first_name: 'Alterado' };
  this.resposta = await this.api.fetch(`/users/${id}`, { method: metodo, data: corpo, headers: comMeuToken(this) });
});

When('apago a conta do outro cliente', async function (this: MundoToolshop) {
  this.resposta = await this.api.delete(`/users/${outroCliente(this).id}`, { headers: comMeuToken(this) });
});

// Na própria conta: o cliente pede o perfil de administrador numa alteração ao seu perfil.
When('peço o perfil de administrador numa alteração à minha conta', async function (this: MundoToolshop) {
  const conta = this.contaRegistada;
  if (!conta) throw new Error('Este passo precisa de uma conta antes ("que tenho uma conta registada").');
  const login = await this.api.post('/users/login', { data: { email: conta.email, password: conta.password } });
  expect(login.status(), await corpoSeguro(login)).toBe(200);
  const token = (await login.json()).access_token;
  this.resposta = await this.api.patch(`/users/${conta.id}`, { data: { role: 'admin' }, headers: { Authorization: `Bearer ${token}` } });
});

// Oráculo da exposição: a resposta não pode conter o email nem o id do outro cliente,
// seja qual for o código (uma recusa, ou uma lista onde ele não aparece).
Then('os dados do outro cliente não me são mostrados', async function (this: MundoToolshop) {
  const { id, dados } = outroCliente(this);
  const texto = (await this.resposta!.text()).toLowerCase();
  expect(texto.includes(dados.email.toLowerCase()), `a resposta (${this.resposta!.status()}) contém o email do outro cliente`).toBe(false);
  expect(texto.includes(id.toLowerCase()), `a resposta (${this.resposta!.status()}) contém o id do outro cliente`).toBe(false);
});

// A recusa só conta se nada mudou: confirmamos com o próprio outro cliente.
Then('os dados do outro cliente ficam como estavam', async function (this: MundoToolshop) {
  const { token, dados } = outroCliente(this);
  const eu = await this.api.get('/users/me', { headers: { Authorization: `Bearer ${token}` } });
  expect(eu.status(), await corpoSeguro(eu)).toBe(200);
  expect((await eu.json()).first_name, 'nome do outro cliente').toBe(dados.first_name);
});

Then('a conta do outro cliente continua a existir', async function (this: MundoToolshop) {
  const { dados } = outroCliente(this);
  const login = await this.api.post('/users/login', { data: { email: dados.email, password: dados.password } });
  expect(login.status(), `o outro cliente devia continuar a conseguir entrar: ${await corpoSeguro(login)}`).toBe(200);
});

// ---------- Marcas e categorias ----------
// Como nos produtos: só o administrador cria, altera e apaga. As consultas de
// verificação levam um parâmetro único, porque a API guarda em cache as respostas
// de GET (a lista de marcas chegou a mostrar marcas já apagadas).

const ENDERECOS: Record<string, string> = { marca: '/brands', categoria: '/categories' };
// Consultar uma só: a marca em /brands/{id}; a categoria só em /categories/tree/{id}
// (o Swagger não documenta GET /categories/{id}, que responde 405).
const LEITURA: Record<string, string> = { '/brands': '/brands', '/categories': '/categories/tree' };
const semCache = () => ({ semcache: Date.now().toString() });

function nomeUnico(recurso: string) {
  const sufixo = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  return { name: `Teste ${recurso} ${sufixo}`, slug: `teste-${recurso}-${sufixo}` };
}

function marcaOuCategoria(mundo: MundoToolshop) {
  if (!mundo.marcaOuCategoria) throw new Error('Este passo precisa de uma marca ou categoria antes ("que existe uma marca na loja").');
  return mundo.marcaOuCategoria;
}

Given(/^que existe uma (marca|categoria) na loja$/, async function (this: MundoToolshop, recurso: string) {
  const endereco = ENDERECOS[recurso];
  const dados = nomeUnico(recurso);
  const token = await tokenDeAdministrador(this.api);
  const criacao = await this.api.post(endereco, { data: dados, headers: { Authorization: `Bearer ${token}` } });
  expect(criacao.status(), await corpoSeguro(criacao)).toBe(201);
  const id = (await criacao.json()).id;
  this.registosCriados.push({ endereco, id });
  this.marcaOuCategoria = { endereco, id, nome: dados.name, slug: dados.slug };
});

When(/^crio uma (marca|categoria)$/, async function (this: MundoToolshop, recurso: string) {
  const endereco = ENDERECOS[recurso];
  const dados = nomeUnico(recurso);
  this.nomeTentado = dados.name;
  this.resposta = await this.api.post(endereco, { data: dados, headers: cabecalhosDeAutenticacao(this) });
  // Se a API aceitar (bug), o registo fica para o hook After apagar.
  if (this.resposta.status() === 201) this.registosCriados.push({ endereco, id: (await this.resposta.json()).id });
});

// PUT envia a marca ou categoria completa com o nome novo; PATCH envia só o nome.
When(/^altero o nome da (?:marca|categoria) com um pedido (PUT|PATCH)$/, async function (this: MundoToolshop, metodo: string) {
  const { endereco, id, slug } = marcaOuCategoria(this);
  const corpo = metodo === 'PUT' ? { name: 'Alterado', slug } : { name: 'Alterado' };
  this.resposta = await this.api.fetch(`${endereco}/${id}`, { method: metodo, data: corpo, headers: cabecalhosDeAutenticacao(this) });
});

When(/^apago a (?:marca|categoria)$/, async function (this: MundoToolshop) {
  const { endereco, id } = marcaOuCategoria(this);
  this.resposta = await this.api.delete(`${endereco}/${id}`, { headers: cabecalhosDeAutenticacao(this) });
});

Then(/^a (marca|categoria) não fica criada$/, async function (this: MundoToolshop, recurso: string) {
  const pesquisa = await this.api.get(`${ENDERECOS[recurso]}/search`, { params: { q: this.nomeTentado!, ...semCache() } });
  expect(pesquisa.status(), await corpoSeguro(pesquisa)).toBe(200);
  const nomes = (await pesquisa.json()).map((r: { name: string }) => r.name);
  expect(nomes, `a ${recurso} não devia existir`).not.toContain(this.nomeTentado);
});

Then(/^a (?:marca|categoria) mantém o nome$/, async function (this: MundoToolshop) {
  const { endereco, id, nome } = marcaOuCategoria(this);
  const consulta = await this.api.get(`${LEITURA[endereco]}/${id}`, { params: semCache() });
  expect(consulta.status(), await corpoSeguro(consulta)).toBe(200);
  expect((await consulta.json()).name, 'nome').toBe(nome);
});

Then(/^a (?:marca|categoria) continua a existir$/, async function (this: MundoToolshop) {
  const { endereco, id } = marcaOuCategoria(this);
  const consulta = await this.api.get(`${LEITURA[endereco]}/${id}`, { params: semCache() });
  expect(consulta.status(), 'devia continuar a existir').toBe(200);
});

// ---------- Relatórios e lista de faturas ----------

When('consulto o relatório {string}', async function (this: MundoToolshop, relatorio: string) {
  this.resposta = await this.api.get(`/reports/${relatorio}`, { headers: comMeuToken(this) });
});

Then('o relatório não me é mostrado', async function (this: MundoToolshop) {
  expect(CODIGOS_DE_RECUSA, `código de recusa esperado; veio ${this.resposta!.status()}: ${await corpoSeguro(this.resposta!)}`)
    .toContain(this.resposta!.status());
});

// Todas as páginas da lista (ou da pesquisa) de faturas, com a sessão do cenário.
When(/^consulto (a lista das minhas faturas|a pesquisa de faturas)$/, async function (this: MundoToolshop, qual: string) {
  const endereco = qual.includes('pesquisa') ? '/invoices/search' : '/invoices';
  const params: Record<string, string> = qual.includes('pesquisa') ? { q: 'INV' } : {};
  this.faturasRecebidas = [];
  for (let pagina = 1, ultima = 1; pagina <= ultima; pagina++) {
    const resposta = await this.api.get(endereco, { params: { ...params, page: pagina }, headers: comMeuToken(this) });
    expect(resposta.status(), await corpoSeguro(resposta)).toBe(200);
    const corpo = await resposta.json();
    ultima = corpo.last_page;
    this.faturasRecebidas.push(...corpo.data.map((f: { invoice_number: string; user_id: string }) => ({ numero: f.invoice_number, dono: f.user_id })));
  }
});

// Oráculo: todas as faturas recebidas são minhas, e a do outro cliente não está lá.
Then('só recebo faturas minhas', async function (this: MundoToolshop) {
  const eu = await this.api.get('/users/me', { headers: comMeuToken(this) });
  expect(eu.status(), await corpoSeguro(eu)).toBe(200);
  const meuId = (await eu.json()).id;
  const faturas = this.faturasRecebidas;
  expect(faturas.length, 'devia haver faturas minhas').toBeGreaterThan(0);
  const deOutros = faturas.filter((f) => f.dono !== meuId).map((f) => f.numero);
  expect(deOutros, 'faturas de outros clientes na lista').toEqual([]);
  expect(faturas.map((f) => f.numero), 'a fatura do outro cliente').not.toContain(faturaDoOutroCliente(this).numero);
});

// ---------- Favoritos ----------

Given('que outro cliente tem um produto nos favoritos', async function (this: MundoToolshop) {
  await criarOutroCliente(this);
  const { token } = this.outroCliente!;
  const produto = (await (await this.api.get('/products')).json()).data[0].id;
  const favorito = await this.api.post('/favorites', { data: { product_id: produto }, headers: { Authorization: `Bearer ${token}` } });
  expect(favorito.status(), await corpoSeguro(favorito)).toBe(201);
  const id = (await favorito.json()).id;
  this.favoritoDoOutroCliente = id;
  // Só o dono apaga o favorito; tem de ser antes de a conta ser apagada.
  this.limpezas.push(() => this.api.delete(`/favorites/${id}`, { headers: { Authorization: `Bearer ${token}` } }));
});

function favoritoDoOutro(mundo: MundoToolshop) {
  if (!mundo.favoritoDoOutroCliente) throw new Error('Este passo precisa de um favorito do outro cliente ("que outro cliente tem um produto nos favoritos").');
  return mundo.favoritoDoOutroCliente;
}

When('consulto o favorito do outro cliente', async function (this: MundoToolshop) {
  this.resposta = await this.api.get(`/favorites/${favoritoDoOutro(this)}`, { headers: comMeuToken(this) });
});

When('apago o favorito do outro cliente', async function (this: MundoToolshop) {
  this.resposta = await this.api.delete(`/favorites/${favoritoDoOutro(this)}`, { headers: comMeuToken(this) });
});

When('consulto a lista dos meus favoritos', async function (this: MundoToolshop) {
  this.resposta = await this.api.get('/favorites', { headers: comMeuToken(this) });
});

Then('o favorito não me é mostrado', async function (this: MundoToolshop) {
  expect(CODIGOS_DE_RECUSA, `código de recusa esperado; veio ${this.resposta!.status()}: ${await corpoSeguro(this.resposta!)}`)
    .toContain(this.resposta!.status());
});

Then('a lista não tem o favorito do outro cliente', async function (this: MundoToolshop) {
  expect(this.resposta!.status(), await corpoSeguro(this.resposta!)).toBe(200);
  const ids = (await this.resposta!.json()).map((f: { id: string }) => f.id);
  expect(ids, 'favoritos na minha lista').not.toContain(favoritoDoOutro(this));
});

// Confirmado pelo dono, com um endereço único (as respostas de GET vêm de cache).
Then('o favorito do outro cliente continua a existir', async function (this: MundoToolshop) {
  const consulta = await this.api.get('/favorites', {
    params: { semcache: Date.now().toString() },
    headers: { Authorization: `Bearer ${outroCliente(this).token}` },
  });
  expect(consulta.status(), await corpoSeguro(consulta)).toBe(200);
  expect((await consulta.json()).map((f: { id: string }) => f.id), 'favoritos do outro cliente').toContain(favoritoDoOutro(this));
});

// ---------- Especificações dos produtos ----------
// Como os produtos (#17), as marcas e as categorias (#30): só o administrador as gere.
// As consultas levam um endereço único, por causa da cache das respostas de GET.

function produtoDoCenario(mundo: MundoToolshop) {
  if (!mundo.produtoId) throw new Error('Este passo precisa de um produto antes ("que existe um produto na loja").');
  return mundo.produtoId;
}

async function especificacoesDoProduto(mundo: MundoToolshop) {
  const consulta = await mundo.api.get(`/products/${produtoDoCenario(mundo)}/specs`, { params: semCache() });
  expect(consulta.status(), await corpoSeguro(consulta)).toBe(200);
  return (await consulta.json()) as { id: string; spec_name: string; spec_value: string }[];
}

// Apaga, com o administrador, o que um bug deixar criar, antes de o produto ser apagado.
function limparEspecificacoes(mundo: MundoToolshop) {
  mundo.limpezas.push(async () => {
    const token = await tokenDeAdministrador(mundo.api);
    for (const spec of await especificacoesDoProduto(mundo)) {
      await mundo.api.delete(`/products/${produtoDoCenario(mundo)}/specs/${spec.id}`, { headers: { Authorization: `Bearer ${token}` } });
    }
  });
}

Given('que o produto tem uma especificação', async function (this: MundoToolshop) {
  const token = await tokenDeAdministrador(this.api);
  const criacao = await this.api.post(`/products/${produtoDoCenario(this)}/specs`, {
    data: { spec_name: 'Weight', spec_value: '1.5', spec_unit: 'kg' },
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(criacao.status(), await corpoSeguro(criacao)).toBe(201);
  this.especificacao = { id: (await criacao.json()).id, valor: '1.5' };
  limparEspecificacoes(this);
});

When('acrescento uma especificação ao produto', async function (this: MundoToolshop) {
  this.nomeDaEspecificacaoTentada = `Teste ${Date.now().toString(36)}`;
  this.resposta = await this.api.post(`/products/${produtoDoCenario(this)}/specs`, {
    data: { spec_name: this.nomeDaEspecificacaoTentada, spec_value: '1', spec_unit: 'kg' },
    headers: cabecalhosDeAutenticacao(this),
  });
  limparEspecificacoes(this);
});

When(/^(altero|apago) a especificação do produto$/, async function (this: MundoToolshop, acao: string) {
  const id = this.especificacao!.id;
  const endereco = `/products/${produtoDoCenario(this)}/specs/${id}`;
  this.resposta = acao === 'altero'
    ? await this.api.put(endereco, { data: { spec_name: 'Weight', spec_value: '99', spec_unit: 'kg' }, headers: cabecalhosDeAutenticacao(this) })
    : await this.api.delete(endereco, { headers: cabecalhosDeAutenticacao(this) });
});

Then('o produto não fica com a especificação nova', async function (this: MundoToolshop) {
  const nomes = (await especificacoesDoProduto(this)).map((s) => s.spec_name);
  expect(nomes, 'especificações do produto').not.toContain(this.nomeDaEspecificacaoTentada);
});

Then('a especificação do produto fica como estava', async function (this: MundoToolshop) {
  const spec = (await especificacoesDoProduto(this)).find((s) => s.id === this.especificacao!.id);
  expect(spec?.spec_value, 'valor da especificação').toBe(this.especificacao!.valor);
});
