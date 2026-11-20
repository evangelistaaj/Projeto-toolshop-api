import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import type { MundoToolshop } from '../support/world';
import { fazerLogin } from '../support/autenticacao';
import {
  campoDoRegisto,
  comCampo,
  dadosDeClienteValidos,
  type DadosCliente,
} from '../support/clientes';
import { dataDeNascimento } from '../support/datas';
import { corpoSeguro } from '../support/seguranca';

// Envia o registo e, se for aceite, guarda a conta (para login e para a limpeza).
async function registar(mundo: MundoToolshop, dados: DadosCliente) {
  mundo.dadosDoRegisto = dados;
  mundo.resposta = await mundo.api.post('/users/register', { data: dados });
  if (mundo.resposta.status() === 201) {
    const id = (await mundo.resposta.json()).id;
    mundo.clientesCriados.push(id);
    mundo.contaRegistada = { id, email: dados.email, password: dados.password };
  }
}

// Os erros de validação desta API vêm como {"campo": [...]} (ver bug #6) ou dentro de "errors".
async function camposComErro(mundo: MundoToolshop): Promise<string[]> {
  const corpo = await mundo.resposta!.json();
  return Object.keys(corpo.errors ?? corpo);
}

// Lê as "claims" do token de acesso (JWT): a parte do meio é JSON em base64url.
function claimsDoToken(token: string): Record<string, unknown> {
  return JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'));
}

// ---------- Preparação e ações ----------

Given('que tenho uma conta registada', async function (this: MundoToolshop) {
  await registar(this, dadosDeClienteValidos());
  expect(this.resposta!.status(), await corpoSeguro(this.resposta!)).toBe(201);
});

When('registo um cliente com dados válidos', async function (this: MundoToolshop) {
  await registar(this, dadosDeClienteValidos());
});

// Uma expressão regular, e não "{}": assim este passo só aceita idades ("faz 18 anos hoje")
// e não se confunde com "registo um cliente que pede o perfil de administrador".
When(/^registo um cliente que ((?:faz|fez) \d+ anos (?:hoje|ontem|amanhã))$/, async function (this: MundoToolshop, idade: string) {
  await registar(this, { ...dadosDeClienteValidos(), dob: dataDeNascimento(idade) });
});

When('registo um cliente sem data de nascimento', async function (this: MundoToolshop) {
  const dados = dadosDeClienteValidos();
  delete dados.dob;
  await registar(this, dados);
});

When('registo um cliente com o campo {string} igual a {string}', async function (this: MundoToolshop, campo: string, valor: string) {
  await registar(this, comCampo(dadosDeClienteValidos(), campoDoRegisto(campo), valor));
});

When('registo outro cliente com o mesmo email', async function (this: MundoToolshop) {
  const email = this.contaRegistada!.email;
  await registar(this, { ...dadosDeClienteValidos(), email });
});

When('registo um cliente que pede o perfil de administrador', async function (this: MundoToolshop) {
  await registar(this, { ...dadosDeClienteValidos(), role: 'admin' });
});

// ---------- Resultados ----------

Then('o registo é aceite', async function (this: MundoToolshop) {
  expect(this.resposta!.status(), await corpoSeguro(this.resposta!)).toBe(201);
});

Then('o registo é recusado por causa do campo {string}', async function (this: MundoToolshop, campo: string) {
  expect(this.resposta!.status(), await corpoSeguro(this.resposta!)).toBe(422);
  expect(await camposComErro(this), `só o campo "${campo}" devia ser recusado`).toEqual([campoDoRegisto(campo)]);
});

// Um email repetido é um conflito de estado e não um pedido mal formado: 409 (decisão da Toolshop).
Then('o registo é recusado por já existir uma conta com esse email', async function (this: MundoToolshop) {
  expect(this.resposta!.status(), await corpoSeguro(this.resposta!)).toBe(409);
  expect(await camposComErro(this), 'o erro devia estar no email').toEqual(['email']);
});

Then('consigo fazer login com a conta registada', async function (this: MundoToolshop) {
  const conta = this.contaRegistada!;
  await fazerLogin(this, conta.email, conta.password);
  expect(this.resposta!.status(), await corpoSeguro(this.resposta!)).toBe(200);

  const eu = await this.api.get('/users/me', { headers: { Authorization: `Bearer ${this.token}` } });
  expect(eu.status(), await corpoSeguro(eu)).toBe(200);
  const dados = await eu.json();
  expect(dados.email, 'email da conta').toBe(conta.email);
  expect(dados.first_name, 'nome da conta').toBe(this.dadosDoRegisto!.first_name);
});

// O perfil vem no token (claim "role"); confirmamos também que uma função de administrador é recusada.
Then('a conta registada tem o perfil de cliente', async function (this: MundoToolshop) {
  const conta = this.contaRegistada!;
  await fazerLogin(this, conta.email, conta.password);
  expect(this.resposta!.status(), await corpoSeguro(this.resposta!)).toBe(200);
  expect(claimsDoToken(this.token!).role, 'perfil no token').toBe('user');

  const listaDeUtilizadores = await this.api.get('/users', { headers: { Authorization: `Bearer ${this.token}` } });
  expect(listaDeUtilizadores.status(), 'a lista de utilizadores é só para o administrador').toBe(403);
});
