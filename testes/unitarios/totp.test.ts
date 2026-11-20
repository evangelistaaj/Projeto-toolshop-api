import { test } from 'node:test';
import assert from 'node:assert/strict';
import { codigoTotp } from '../../support/totp';

// Vetores de teste oficiais da RFC 6238 (anexo B), para SHA-1, com 8 algarismos.
// Segredo: "12345678901234567890" em ASCII, que em base32 é o valor abaixo.
const SEGREDO = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';

test('codigoTotp dá os valores oficiais da RFC 6238 (8 algarismos)', () => {
  assert.equal(codigoTotp(SEGREDO, 59_000, 8), '94287082');
  assert.equal(codigoTotp(SEGREDO, 1_111_111_109_000, 8), '07081804');
  assert.equal(codigoTotp(SEGREDO, 1_234_567_890_000, 8), '89005924');
  assert.equal(codigoTotp(SEGREDO, 20_000_000_000_000, 8), '65353130');
});

test('codigoTotp com 6 algarismos (o da Toolshop) são os últimos 6, com zeros à esquerda', () => {
  assert.equal(codigoTotp(SEGREDO, 1_111_111_109_000), '081804');
});

test('codigoTotp: o mesmo código dentro dos mesmos 30 segundos, outro no período seguinte (controlo)', () => {
  assert.equal(codigoTotp(SEGREDO, 60_000), codigoTotp(SEGREDO, 89_999));
  assert.notEqual(codigoTotp(SEGREDO, 89_999), codigoTotp(SEGREDO, 90_000));
});

test('codigoTotp: um segredo que não é base32 falha com uma mensagem clara', () => {
  assert.throws(() => codigoTotp('ABC1'), /base32/);
});
