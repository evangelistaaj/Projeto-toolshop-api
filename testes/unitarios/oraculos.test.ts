import { test } from 'node:test';
import assert from 'node:assert/strict';
import { camposComNome, caminhosQueContem, repetidos, foraDeOrdem, diferencas } from '../../support/oraculos';

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

// ---------- Catálogo ----------
const p = (name: string, price = 1) => ({ name, price });

test('foraDeOrdem aceita uma lista por nome, sem distinguir maiúsculas, e com nomes iguais (controlo)', () => {
  const lista = [p('Angled Spanner'), p('bolt Cutters'), p('Claw Hammer'), p('Claw Hammer with Fiberglass Handle')];
  assert.deepEqual(foraDeOrdem(lista, 'nome', 'crescente'), []);
  assert.deepEqual(foraDeOrdem([p('Claw Hammer'), p('claw hammer')], 'nome', 'crescente'), []);
});

test('foraDeOrdem apanha o par trocado, nos dois sentidos', () => {
  assert.deepEqual(foraDeOrdem([p('Belt Sander'), p('Adjustable Wrench')], 'nome', 'crescente'), ['Belt Sander antes de Adjustable Wrench']);
  assert.deepEqual(foraDeOrdem([p('Adjustable Wrench'), p('Belt Sander')], 'nome', 'decrescente'), ['Adjustable Wrench antes de Belt Sander']);
});

test('foraDeOrdem compara preços como números (9.17 antes de 12.01) e aceita preços iguais', () => {
  assert.deepEqual(foraDeOrdem([p('A', 9.17), p('B', 12.01), p('C', 12.01)], 'preço', 'crescente'), []);
  assert.deepEqual(foraDeOrdem([p('A', 12.01), p('B', 9.17)], 'preço', 'crescente'), ['A (12.01) antes de B (9.17)']);
  assert.deepEqual(foraDeOrdem([p('A', 9.17), p('B', 12.01)], 'preço', 'decrescente'), ['A (9.17) antes de B (12.01)']);
});

test('diferencas mostra o que veio a mais e o que falta, sem olhar à ordem', () => {
  assert.deepEqual(diferencas(['b', 'a'], ['a', 'b']), { aMais: [], emFalta: [] });
  assert.deepEqual(diferencas(['a', 'x'], ['a', 'b']), { aMais: ['x'], emFalta: ['b'] });
  assert.deepEqual(diferencas([], ['a']), { aMais: [], emFalta: ['a'] });
});
