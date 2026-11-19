import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import type { MundoToolshop } from '../support/world';
import { cabecalhosDeAutenticacao, tokenDeAdministrador } from '../support/autenticacao';
import { compraFeitaCom } from '../support/compras';
import { contaOutroCliente } from '../support/contas';
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

Then('a alteração é recusada', async function (this: MundoToolshop) {
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
