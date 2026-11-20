import { Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import type { MundoToolshop } from '../support/world';
import { corpoSeguro } from '../support/seguranca';
import { desviosDoContrato } from '../support/contratos';

// Passo genérico: serve a qualquer funcionalidade que verifique um código HTTP.
Then('recebo uma resposta com o código {int}',
  async function (this: MundoToolshop, codigo: number) {
    if (!this.resposta) {
      throw new Error('Este passo precisa de um "Quando" que faça um pedido antes.');
    }
    expect(this.resposta.status(), await corpoSeguro(this.resposta)).toBe(codigo);
  });

// Contrato da resposta (contratos/<nome>.schema.json, a partir do Swagger). Primeiro o
// código HTTP de sucesso, depois a forma: cada desvio aparece numa linha, com o campo.
Then('a resposta segue o contrato {string}',
  async function (this: MundoToolshop, nome: string) {
    if (!this.resposta) {
      throw new Error('Este passo precisa de um "Quando" que faça um pedido antes.');
    }
    expect(this.resposta.ok(), await corpoSeguro(this.resposta)).toBe(true);
    const desvios = desviosDoContrato(nome, await this.resposta.json());
    expect(desvios, `a resposta não segue o contrato "${nome}"`).toEqual([]);
  });
