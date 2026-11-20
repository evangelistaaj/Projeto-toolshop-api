import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import type { MundoToolshop } from '../support/world';
import { corpoSeguro } from '../support/seguranca';
import { codigoTotp } from '../support/totp';

// Renovação do token (/users/refresh) e verificação em dois passos (TOTP), sempre numa
// conta criada no cenário ("que tenho uma conta registada") e apagada no fim.

function conta(mundo: MundoToolshop) {
  if (!mundo.contaRegistada) throw new Error('Este passo precisa de uma conta antes ("que tenho uma conta registada").');
  return mundo.contaRegistada;
}

const comToken = (token?: string): Record<string, string> => (token ? { Authorization: `Bearer ${token}` } : {});

async function aMinhaConta(mundo: MundoToolshop, token?: string) {
  return (await mundo.api.get('/users/me', { headers: comToken(token) })).status();
}

// ---------- Renovação do token ----------

When('renovo o meu token', async function (this: MundoToolshop) {
  this.tokenAntigo = this.token;
  this.resposta = await this.api.get('/users/refresh', { headers: comToken(this.token) });
  if (this.resposta.ok()) this.token = (await this.resposta.json()).access_token;
});

When('renovo o token sem enviar nenhum', async function (this: MundoToolshop) {
  this.resposta = await this.api.get('/users/refresh');
});

Then('recebo um token novo e o antigo deixa de ser aceite', async function (this: MundoToolshop) {
  expect(this.resposta!.status(), await corpoSeguro(this.resposta!)).toBe(200);
  expect(this.token, 'o token novo devia ser diferente').not.toBe(this.tokenAntigo);
  expect(await aMinhaConta(this, this.token), 'a conta com o token novo').toBe(200);
  expect(await aMinhaConta(this, this.tokenAntigo), 'a conta com o token antigo').toBe(401);
});

Then('a renovação é recusada', async function (this: MundoToolshop) {
  expect(this.resposta!.status(), await corpoSeguro(this.resposta!)).toBe(401);
});

// Quem tinha a sessão de antes de mudar a password não pode prolongá-la (ver o bug #33).
Then('a sessão de antes da alteração não pode ser renovada', async function (this: MundoToolshop) {
  expect(this.resposta!.status(), await corpoSeguro(this.resposta!)).toBe(200);
  const renovacao = await this.api.get('/users/refresh', { headers: comToken(this.tokenAntigo) });
  expect(renovacao.status(), 'renovar o token de antes da alteração').toBe(401);
});

// ---------- Verificação em dois passos (TOTP) ----------

async function ativarTotp(mundo: MundoToolshop, codigo?: (segredo: string) => string) {
  const configuracao = await mundo.api.post('/totp/setup', { headers: comToken(mundo.token) });
  expect(configuracao.status(), await corpoSeguro(configuracao)).toBe(200);
  mundo.segredoTotp = (await configuracao.json()).secret;
  const totp = codigo ? codigo(mundo.segredoTotp!) : codigoTotp(mundo.segredoTotp!);
  mundo.resposta = await mundo.api.post('/totp/verify', { data: { totp }, headers: comToken(mundo.token) });
}

Given('que ativei a verificação em dois passos', async function (this: MundoToolshop) {
  await ativarTotp(this);
  expect(this.resposta!.status(), await corpoSeguro(this.resposta!)).toBe(200);
});

When('ativo a verificação em dois passos com um código errado', async function (this: MundoToolshop) {
  // Um código certo, com um algarismo mudado: nunca é o código do momento.
  await ativarTotp(this, (segredo) => codigoTotp(segredo).replace(/^./, (a) => String((Number(a) + 1) % 10)));
});

When('faço login com a conta registada', async function (this: MundoToolshop) {
  const { email, password } = conta(this);
  this.resposta = await this.api.post('/users/login', { data: { email, password } });
});

// Login em dois passos: email e password dão um token restrito; o código TOTP troca-o
// pelo token de acesso, em /totp/login/totp (no código da Toolshop; o Swagger não o documenta).
When('completo o login com o código de dois passos', async function (this: MundoToolshop) {
  const { email, password } = conta(this);
  const login = await this.api.post('/users/login', { data: { email, password } });
  expect(login.status(), await corpoSeguro(login)).toBe(200);
  const restrito = (await login.json()).access_token;
  this.resposta = await this.api.post('/totp/login/totp', {
    data: { access_token: restrito, totp: codigoTotp(this.segredoTotp!) },
    headers: comToken(restrito),
  });
});

Then('o login pede o código de dois passos e ainda não dá acesso à conta', async function (this: MundoToolshop) {
  expect(this.resposta!.status(), await corpoSeguro(this.resposta!)).toBe(200);
  const corpo = await this.resposta!.json();
  expect(corpo.requires_totp, 'o login devia pedir o código').toBe(true);
  expect(await aMinhaConta(this, corpo.access_token), 'a conta, antes do código').toBe(401);
});

Then('entro na minha conta', async function (this: MundoToolshop) {
  expect(this.resposta!.status(), await corpoSeguro(this.resposta!)).toBe(200);
  const token = (await this.resposta!.json()).access_token;
  expect(await aMinhaConta(this, token), 'a conta, depois do código').toBe(200);
});
