import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { lerToken, tokenAlterado, tokenSemAssinatura, tokenAssinado } from '../../support/jwt';

// Um token de exemplo, assinado com um segredo de teste (HS256), como os da Toolshop.
const SEGREDO = 'segredo-de-teste';
const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url');
const assinar = (semAssinatura: string, segredo = SEGREDO) =>
  createHmac('sha256', segredo).update(semAssinatura).digest('base64url');
const cabecalho = { typ: 'JWT', alg: 'HS256' };
const conteudo = { sub: '01ABC', role: 'user', iat: 1_700_000_000, exp: 1_700_000_300 };
const TOKEN = `${b64(cabecalho)}.${b64(conteudo)}.${assinar(`${b64(cabecalho)}.${b64(conteudo)}`)}`;

// Verifica a assinatura de um token, como faria a Toolshop.
function assinaturaValida(token: string, segredo = SEGREDO): boolean {
  const [c, p, a] = token.split('.');
  return a === assinar(`${c}.${p}`, segredo);
}

test('o token de exemplo tem uma assinatura válida (controlo dos testes seguintes)', () => {
  assert.equal(assinaturaValida(TOKEN), true);
});

test('lerToken lê o cabeçalho e o conteúdo', () => {
  const { cabecalho: c, conteudo: p } = lerToken(TOKEN);
  assert.deepEqual(c, cabecalho);
  assert.deepEqual(p, conteudo);
});

test('tokenAlterado muda o conteúdo, mantém a assinatura original e deixa de ser válido', () => {
  const alterado = tokenAlterado(TOKEN, { role: 'admin' });
  assert.equal(lerToken(alterado).conteudo.role, 'admin');
  assert.equal(alterado.split('.')[2], TOKEN.split('.')[2], 'a assinatura devia ser a original');
  assert.equal(assinaturaValida(alterado), false, 'um token alterado não pode ter assinatura válida');
});

test('tokenSemAssinatura declara alg "none" e não tem assinatura', () => {
  const semAssinatura = tokenSemAssinatura(TOKEN);
  assert.equal(lerToken(semAssinatura).cabecalho.alg, 'none');
  assert.equal(semAssinatura.split('.')[2], '');
  assert.deepEqual(lerToken(semAssinatura).conteudo, conteudo);
});

test('tokenAssinado com o segredo certo dá um token válido, com as datas novas', () => {
  const novo = tokenAssinado(TOKEN, { exp: 1_700_000_999 }, SEGREDO);
  assert.equal(assinaturaValida(novo), true);
  assert.equal(lerToken(novo).conteudo.exp, 1_700_000_999);
  assert.equal(lerToken(novo).conteudo.sub, '01ABC', 'o resto do conteúdo mantém-se');
});

test('tokenAssinado com outro segredo não passa na verificação (sabotagem)', () => {
  const comOutroSegredo = tokenAssinado(TOKEN, { exp: 1_700_000_999 }, 'outro-segredo');
  assert.equal(assinaturaValida(comOutroSegredo), false);
});
