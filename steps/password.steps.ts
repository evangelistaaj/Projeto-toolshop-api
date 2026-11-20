import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import type { MundoToolshop } from '../support/world';
import { fazerLogin } from '../support/autenticacao';
import { passwordValida } from '../support/clientes';
import { corpoSeguro } from '../support/seguranca';

// Todos os cenários usam uma conta nova ("que tenho uma conta registada"), apagada no fim:
// mudar passwords nunca toca nas contas de demonstração.

function conta(mundo: MundoToolshop) {
  if (!mundo.contaRegistada) throw new Error('Este passo precisa de uma conta antes ("que tenho uma conta registada").');
  return mundo.contaRegistada;
}

async function entra(mundo: MundoToolshop, password: string) {
  const login = await mundo.api.post('/users/login', { data: { email: conta(mundo).email, password } });
  return login.status();
}

// A password que a recuperação da Toolshop põe em qualquer conta (ver o bug #31).
const PASSWORD_DA_RECUPERACAO = 'welcome02';

Given('que fiz login com a conta registada', async function (this: MundoToolshop) {
  const { email, password } = conta(this);
  await fazerLogin(this, email, password);
  expect(this.resposta!.status(), await corpoSeguro(this.resposta!)).toBe(200);
});

async function alterarPassword(mundo: MundoToolshop, atual: string, nova: string, confirmacao: string) {
  mundo.passwordAntiga = conta(mundo).password;
  mundo.tokenAntigo = mundo.token;
  mundo.resposta = await mundo.api.post('/users/change-password', {
    data: { current_password: atual, new_password: nova, new_password_confirmation: confirmacao },
    headers: { Authorization: `Bearer ${mundo.token}` },
  });
  if (mundo.resposta.ok()) conta(mundo).password = nova;
}

When('altero a minha password', async function (this: MundoToolshop) {
  const nova = passwordValida();
  await alterarPassword(this, conta(this).password, nova, nova);
});

When(/^altero a minha password com (a password atual errada|uma confirmação diferente|uma password fraca)$/,
  async function (this: MundoToolshop, problema: string) {
    const nova = passwordValida();
    if (problema === 'a password atual errada') await alterarPassword(this, passwordValida(), nova, nova);
    else if (problema === 'uma confirmação diferente') await alterarPassword(this, conta(this).password, nova, passwordValida());
    else await alterarPassword(this, conta(this).password, 'abc', 'abc');
  });

When('peço uma nova password para a conta registada', async function (this: MundoToolshop) {
  this.passwordAntiga = conta(this).password;
  this.resposta = await this.api.post('/users/forgot-password', { data: { email: conta(this).email } });
});

When('peço uma nova password para um email com conta e para um email sem conta', async function (this: MundoToolshop) {
  const pedir = async (email: string) => {
    const resposta = await this.api.post('/users/forgot-password', { data: { email } });
    return { codigo: resposta.status(), corpo: await resposta.text() };
  };
  this.respostasDaRecuperacao = {
    comConta: await pedir(conta(this).email),
    semConta: await pedir(`ninguem.${Date.now().toString(36)}@example.com`),
  };
});

Then('a alteração da password é recusada', async function (this: MundoToolshop) {
  expect([400, 422], `recusa esperada; veio ${this.resposta!.status()}: ${await corpoSeguro(this.resposta!)}`)
    .toContain(this.resposta!.status());
});

Then('a password da conta não muda', async function (this: MundoToolshop) {
  expect(await entra(this, this.passwordAntiga!), 'login com a password de antes').toBe(200);
});

Then('entro com a password nova e não com a antiga', async function (this: MundoToolshop) {
  expect(this.resposta!.status(), await corpoSeguro(this.resposta!)).toBe(200);
  expect(await entra(this, conta(this).password), 'login com a password nova').toBe(200);
  expect(await entra(this, this.passwordAntiga!), 'login com a password antiga').toBe(401);
});

// Quem tinha uma sessão aberta (por exemplo, num computador partilhado) não pode continuar
// a usar a conta depois de a password mudar.
Then('a sessão de antes da alteração deixa de ser aceite', async function (this: MundoToolshop) {
  expect(this.resposta!.status(), await corpoSeguro(this.resposta!)).toBe(200);
  const eu = await this.api.get('/users/me', { headers: { Authorization: `Bearer ${this.tokenAntigo}` } });
  expect(eu.status(), 'o token de antes da alteração').toBe(401);
});

// Pedir uma nova password não pode mudar a password: devia só enviar um email com um
// link de reposição. A conta continua a entrar com a sua password, e não com a da Toolshop.
Then('a password da conta continua a mesma', async function (this: MundoToolshop) {
  expect(await entra(this, PASSWORD_DA_RECUPERACAO), `login com "${PASSWORD_DA_RECUPERACAO}"`).not.toBe(200);
  expect(await entra(this, this.passwordAntiga!), 'login com a password da conta').toBe(200);
});

// Respostas diferentes revelam quais emails têm conta (o login já não o revela).
Then('as duas respostas são iguais', async function (this: MundoToolshop) {
  const { comConta, semConta } = this.respostasDaRecuperacao!;
  expect(semConta, 'resposta para um email sem conta').toEqual(comConta);
});
