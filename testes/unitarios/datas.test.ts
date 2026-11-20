import { test, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { dataDeNascimento, validade } from '../../support/datas';

// O relógio é simulado: cada teste diz que dia é "hoje".
function hojeE(instante: string) {
  mock.timers.enable({ apis: ['Date'], now: new Date(instante) });
}
beforeEach(() => mock.timers.reset());
afterEach(() => mock.timers.reset());

test('dataDeNascimento: hoje, ontem e amanhã', () => {
  hojeE('2026-11-19T10:00:00Z');
  assert.equal(dataDeNascimento('faz 18 anos hoje'), '2008-11-19');
  assert.equal(dataDeNascimento('fez 18 anos ontem'), '2008-11-18');
  assert.equal(dataDeNascimento('faz 75 anos amanhã'), '1951-11-20');
});

test('dataDeNascimento: "ontem" no dia 1 de janeiro recua para o ano anterior', () => {
  hojeE('2026-01-01T08:00:00Z');
  assert.equal(dataDeNascimento('fez 18 anos ontem'), '2007-12-31');
});

test('dataDeNascimento: num 29 de fevereiro, a data de há 18 anos não existe e passa para 1 de março', () => {
  // Documenta uma limitação conhecida: neste dia, "faz 18 anos hoje" dá alguém que só faz
  // 18 anos amanhã. Se um dia isto mudar, o teste avisa.
  hojeE('2028-02-29T10:00:00Z');
  assert.equal(dataDeNascimento('faz 18 anos hoje'), '2010-03-01');
});

test('dataDeNascimento: um texto desconhecido falha com uma mensagem que explica o formato', () => {
  assert.throws(() => dataDeNascimento('tem 18 anos'), /Use, por exemplo, "faz 18 anos hoje"/);
});

test('validade: este mês, o mês passado e daqui a N anos', () => {
  hojeE('2026-11-19T10:00:00Z');
  assert.equal(validade('este mês'), '11/2026');
  assert.equal(validade('o mês passado'), '10/2026');
  assert.equal(validade('daqui a 2 anos'), '11/2028');
  assert.equal(validade('daqui a 1 ano'), '11/2027');
});

test('validade: "o mês passado" em janeiro é dezembro do ano anterior', () => {
  hojeE('2026-01-15T10:00:00Z');
  assert.equal(validade('o mês passado'), '12/2025');
});

test('validade: conta o mês em UTC, o fuso da API (00:30 de 1 de agosto em Lisboa ainda é julho em UTC)', () => {
  hojeE('2026-07-31T23:30:00Z');
  assert.equal(validade('este mês'), '07/2026');
});

test('validade: um texto desconhecido falha com uma mensagem que explica as formas aceites', () => {
  assert.throws(() => validade('para o ano'), /Use "este mês", "o mês passado" ou "daqui a N anos"/);
});
