import { Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import type { MundoToolshop } from '../support/world';

// Passo genérico: serve a qualquer funcionalidade que verifique um código HTTP.
Then('recebo uma resposta com o código {int}', async function (this: MundoToolshop, codigo: number) {
  if (!this.resposta) {
    throw new Error('Este passo precisa de um "Quando" que faça um pedido antes.');
  }
  expect(this.resposta.status(), await this.resposta.text()).toBe(codigo);
});