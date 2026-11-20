import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resumoDaFalha } from '../../support/resumo-de-falha.cjs';

// Uma falha típica do Playwright, como o Cucumber a guarda (com cores ANSI e a pilha).
const FALHA = [
  '\u001b[31mError: código de recusa esperado; veio 200: {"success":true}\u001b[39m',
  '',
  'expect(received).toContain(expected) // indexOf',
  '',
  'Expected value: 200',
  'Received array: [401, 403, 404]',
  '    at captureRawStack (C:\\projeto\\node_modules\\playwright-core\\lib\\coreBundle.js:9551:17)',
  '    at MundoToolshop.<anonymous> (C:\\projeto\\steps\\autorizacao.steps.ts:118:6)',
].join('\n');

test('resumoDaFalha guarda a mensagem, o esperado e o recebido', () => {
  assert.deepEqual(resumoDaFalha(FALHA), [
    'código de recusa esperado; veio 200: {"success":true}',
    '',
    'Expected value: 200',
    'Received array: [401, 403, 404]',
  ]);
});

test('resumoDaFalha tira a pilha, as cores e a assinatura do matcher', () => {
  const texto = resumoDaFalha(FALHA).join('\n');
  assert.doesNotMatch(texto, /node_modules|\bat \w|\u001b|expect\(received\)/);
});

test('resumoDaFalha não repete a mensagem nem guarda o cabeçalho "Call Log"', () => {
  const tempo = 'Error: o email devia chegar até 90 s\n\no email devia chegar até 90 s\n\nCall Log:\n- Timeout 90000ms exceeded while waiting on the predicate';
  assert.deepEqual(resumoDaFalha(tempo), [
    'o email devia chegar até 90 s',
    '',
    '- Timeout 90000ms exceeded while waiting on the predicate',
  ]);
});

test('resumoDaFalha corta as linhas muito longas (ex.: o corpo de uma resposta)', () => {
  const [linha] = resumoDaFalha(`Error: ${'x'.repeat(500)}`);
  assert.equal(linha.length, 160);
  assert.ok(linha.endsWith('…'));
});

test('resumoDaFalha aceita uma mensagem vazia ou ausente', () => {
  assert.deepEqual(resumoDaFalha(undefined), []);
});
