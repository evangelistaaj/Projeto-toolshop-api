import { When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import type { MundoToolshop } from '../support/world';
import { contaCliente } from '../support/contas';

// Faz o pedido de login e, se correr bem, guarda o token no World.
// Fica numa função porque vai servir a vários passos (incluindo o "Dado" do cenário 3).
async function fazerLogin(mundo: MundoToolshop, email: string, password: string) {
  mundo.resposta = await mundo.api.post('/users/login', { data: { email, password } });
  if (mundo.resposta.ok()) {
    const corpo = await mundo.resposta.json();
    mundo.token = corpo.access_token;
    mundo.emailLogin = email;
  }
}

When('faço login com a conta de cliente de demonstração', async function (this: MundoToolshop) {
  await fazerLogin(this, contaCliente.email, contaCliente.password);
});

When('faço login com o email {string} e a password {string}',  async function (this: MundoToolshop, email: string, password: string) {
    await fazerLogin(this, email, password);
  },
);

Then('recebo um token de acesso válido', async function (this: MundoToolshop) {
  if (!this.resposta) {
    throw new Error('Este passo precisa de um "Quando" que faça login antes.');
  }

  // 1. Código HTTP
  expect(this.resposta.status(), await this.resposta.text()).toBe(200);

  // 2. e 3. Forma e valores do token
  const corpo = await this.resposta.json();
  expect(corpo.access_token, 'access_token deve ser texto').toEqual(expect.any(String));
  expect(corpo.access_token.length, 'access_token não deve vir vazio').toBeGreaterThan(0);

  // A norma HTTP não distingue maiúsculas no esquema: "Bearer" = "bearer".
  expect(String(corpo.token_type).toLowerCase(), 'token_type').toBe('bearer');

  // Não exigimos 300 exatos: não está documentado e pode mudar sem ser defeito.
  expect(corpo.expires_in, 'expires_in deve ser numérico').toEqual(expect.any(Number));
  expect(corpo.expires_in, 'expires_in deve ser positivo').toBeGreaterThan(0);
});