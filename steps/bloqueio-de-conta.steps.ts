import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import type { MundoToolshop } from '../support/world';
import { corpoSeguro } from '../support/seguranca';

function contaRegistada(mundo: MundoToolshop) {
  if (!mundo.contaRegistada) {
    throw new Error('Este passo precisa de uma conta registada antes ("que tenho uma conta registada").');
  }
  return mundo.contaRegistada;
}

// Falha o login N vezes com uma password errada; cada tentativa tem de ser recusada com 401.
async function falharLogin(mundo: MundoToolshop, vezes: number) {
  const { email } = contaRegistada(mundo);
  for (let i = 1; i <= vezes; i++) {
    mundo.resposta = await mundo.api.post('/users/login', { data: { email, password: 'Password-Errada-1!' } });
    expect(mundo.resposta.status(), `tentativa falhada ${i}: ${await corpoSeguro(mundo.resposta)}`).toBe(401);
  }
}

async function loginComAPasswordCerta(mundo: MundoToolshop) {
  const { email, password } = contaRegistada(mundo);
  mundo.resposta = await mundo.api.post('/users/login', { data: { email, password } });
}

Given('que falhei o login {int} vezes', async function (this: MundoToolshop, vezes: number) {
  await falharLogin(this, vezes);
});

When('falho o login {int} vezes', async function (this: MundoToolshop, vezes: number) {
  await falharLogin(this, vezes);
});

Given('que fiz login com a password certa', async function (this: MundoToolshop) {
  await loginComAPasswordCerta(this);
  expect(this.resposta!.status(), await corpoSeguro(this.resposta!)).toBe(200);
});

When('faço login com a password certa', async function (this: MundoToolshop) {
  await loginComAPasswordCerta(this);
});

When('faço login com uma password errada', async function (this: MundoToolshop) {
  this.resposta = await this.api.post('/users/login', {
    data: { email: contaRegistada(this).email, password: 'Password-Errada-1!' },
  });
});

Then('a conta está bloqueada', async function (this: MundoToolshop) {
  expect(this.resposta!.status(), await corpoSeguro(this.resposta!)).toBe(423);
  expect(await this.resposta!.text(), 'a mensagem devia dizer que a conta está bloqueada').toMatch(/locked/i);
});

Then('entro na conta', async function (this: MundoToolshop) {
  expect(this.resposta!.status(), await corpoSeguro(this.resposta!)).toBe(200);
});

// A resposta não pode deixar perceber se a conta existe: tem de ser igual à de um email inexistente.
Then('a resposta é igual à de um email que não existe', async function (this: MundoToolshop) {
  const comPasswordErrada = { codigo: this.resposta!.status(), corpo: await this.resposta!.json() };
  const inexistente = await this.api.post('/users/login', {
    data: { email: `nao.existe.${Date.now().toString(36)}@example.com`, password: 'Password-Errada-1!' },
  });
  const comEmailInexistente = { codigo: inexistente.status(), corpo: await inexistente.json() };
  expect(comPasswordErrada, 'a resposta a uma password errada devia ser igual à de um email inexistente').toEqual(
    comEmailInexistente,
  );
});
