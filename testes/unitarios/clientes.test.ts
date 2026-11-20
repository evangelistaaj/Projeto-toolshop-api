import { test } from 'node:test';
import assert from 'node:assert/strict';
import { campoDoRegisto, comCampo, dadosDeClienteValidos, passwordValida } from '../../support/clientes';
import { codigoDoPais, normalizar } from '../../support/referencia';

// As regras de password da Toolshop: 8+ caracteres, maiúsculas, minúsculas, algarismos e símbolos.
const REGRAS = [/.{8,}/, /[A-Z]/, /[a-z]/, /\d/, /[^A-Za-z0-9]/];

test('passwordValida cumpre sempre as regras da Toolshop (100 passwords)', () => {
  for (let i = 0; i < 100; i++) {
    const password = passwordValida();
    for (const regra of REGRAS) assert.match(password, regra, `"${password}" falha ${regra}`);
  }
});

test('dadosDeClienteValidos: email único em example.com, sem acentos', () => {
  const a = dadosDeClienteValidos();
  const b = dadosDeClienteValidos();
  assert.match(a.email, /^[a-z]+\.[a-z]+\.[a-z0-9]+@example\.com$/);
  assert.notEqual(a.email, b.email);
});

test('comCampo altera um campo da morada sem mexer nos dados originais', () => {
  const dados = dadosDeClienteValidos();
  const alterados = comCampo(dados, campoDoRegisto('código postal'), '1000-01');
  assert.equal(alterados.address.postal_code, '1000-01');
  assert.equal(dados.address.postal_code, '1100-048', 'os dados originais não podem mudar');
});

test('campoDoRegisto: um campo desconhecido falha e lista os conhecidos', () => {
  assert.throws(() => campoDoRegisto('telemóvel'), /Campos conhecidos: email, password/);
});

test('normalizar ignora acentos, maiúsculas e espaços nas pontas', () => {
  assert.equal(normalizar(' Córdoba '), 'cordoba');
  assert.equal(normalizar('Entre Ríos'), normalizar('entre rios'));
});

test('codigoDoPais: Portugal é PT; um país desconhecido falha com uma mensagem clara', () => {
  assert.equal(codigoDoPais('Portugal'), 'PT');
  assert.throws(() => codigoDoPais('Atlântida'), /não tem código definido em dados\/paises\.json/);
});
