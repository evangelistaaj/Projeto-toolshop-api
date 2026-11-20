import { test } from 'node:test';
import assert from 'node:assert/strict';
import { camposComNome, caminhosQueContem, repetidos } from '../../support/oraculos';

// Uma fatura inventada, com a forma das da Toolshop (o bug #14 da API).
const faturaComCartao = {
  id: '01X',
  payment: {
    payment_method: 'credit-card',
    payment_details: { credit_card_number: '4111-1111-1111-1111', CVV: '123', card_holder_name: 'Jack Howe' },
  },
};
const faturaSegura = {
  id: '01Y',
  payment: { payment_method: 'credit-card', payment_details: { credit_card_number: '****-****-****-1111' } },
};

test('camposComNome encontra o CVV a qualquer profundidade, sem distinguir maiúsculas', () => {
  const campos = camposComNome(faturaComCartao, /cvv|cvc|security_code/i);
  assert.deepEqual(campos.map((c) => c.caminho), ['fatura.payment.payment_details.CVV']);
});

test('camposComNome não encontra nada numa fatura sem código de segurança (controlo)', () => {
  assert.deepEqual(camposComNome(faturaSegura, /cvv|cvc|security_code/i), []);
});

test('caminhosQueContem encontra o número do cartão, com e sem hífenes, e mostra só o caminho', () => {
  const comHifenes = caminhosQueContem(faturaComCartao, ['4111-1111-1111-1111', '4111111111111111']);
  assert.deepEqual(comHifenes, ['fatura.payment.payment_details.credit_card_number']);
  const semHifenes = caminhosQueContem({ numero: 4111111111111111 }, ['4111111111111111']);
  assert.deepEqual(semHifenes, ['fatura.numero']);
});

test('caminhosQueContem encontra o número escondido num texto maior (ex.: uma descrição)', () => {
  const fatura = { notas: 'Pago com o cartão 4111-1111-1111-1111 em 3 prestações' };
  assert.deepEqual(caminhosQueContem(fatura, ['4111-1111-1111-1111']), ['fatura.notas']);
});

test('caminhosQueContem aceita o número mascarado (controlo)', () => {
  assert.deepEqual(caminhosQueContem(faturaSegura, ['4111-1111-1111-1111', '4111111111111111']), []);
});

test('repetidos apanha cada repetição, e uma lista sem repetidos dá vazio', () => {
  assert.deepEqual(repetidos(['a', 'b', 'a', 'c', 'a']), ['a', 'a']);
  assert.deepEqual(repetidos(['a', 'b', 'c']), []);
});
