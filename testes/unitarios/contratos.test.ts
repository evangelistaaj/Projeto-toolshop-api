import { test } from 'node:test';
import assert from 'node:assert/strict';
import { desviosDoContrato } from '../../support/contratos';

// Exemplos inventados, com a forma documentada no Swagger: o controlo de cada contrato.
const marca = { id: 'b1', name: 'ForgeFlex Tools', slug: 'forgeflex-tools' };
const categoria = { id: 'c1', parent_id: null, name: 'Pliers', slug: 'pliers', sub_categories: [] };
const imagem = { id: 'i1', by_name: 'A', by_url: 'u', source_name: 'Unsplash', source_url: 'u', file_name: 'p.avif', title: 'Pliers' };
const produto = {
  id: 'p1', name: 'Pliers', description: 'Uma ferramenta', price: 12.01, is_location_offer: false, is_rental: false,
  in_stock: true, co2_rating: 'A', is_eco_friendly: true, brand: marca, category: categoria, product_image: imagem,
};
const conta = {
  id: 'u1', first_name: 'Jack', last_name: 'Howe', email: 'jack@example.com', dob: '1980-03-03', phone: null,
  address: { street: 'Rua Augusta', house_number: '10', city: 'Lisboa', state: 'Lisboa', country: 'PT', postal_code: '1100-048' },
  provider: null, totp_enabled: false, enabled: true, failed_login_attempts: 0, created_at: '2026-11-20 10:00:00',
};

test('contratos: os exemplos documentados passam (controlo)', () => {
  assert.deepEqual(desviosDoContrato('token', { access_token: 'x', token_type: 'bearer', expires_in: 300 }), []);
  assert.deepEqual(desviosDoContrato('produto', produto), []);
  assert.deepEqual(desviosDoContrato('conta', conta), []);
  const pagina = { current_page: 1, data: [produto], from: 1, last_page: 1, per_page: 9, to: 1, total: 1 };
  assert.deepEqual(desviosDoContrato('página de produtos', pagina), []);
});

test('contratos: campos a mais são permitidos (acrescentar um campo não parte um cliente)', () => {
  assert.deepEqual(desviosDoContrato('produto', { ...produto, specs: [] }), []);
});

test('contratos: um campo em falta é apontado pelo caminho', () => {
  const { slug, ...marcaSemSlug } = marca;
  assert.deepEqual(desviosDoContrato('produto', { ...produto, brand: marcaSemSlug }), ['/brand: falta o campo "slug"']);
});

test('contratos: um tipo errado diz o esperado e o recebido, sem mostrar o valor', () => {
  assert.deepEqual(desviosDoContrato('produto', { ...produto, price: '12.01' }), ['/price: devia ser number, veio string']);
  assert.deepEqual(desviosDoContrato('produto', { ...produto, description: null }), ['/description: devia ser string, veio null']);
});

test('contratos: null só é aceite onde o Swagger o permite', () => {
  assert.deepEqual(desviosDoContrato('conta', { ...conta, phone: null, provider: null }), []);
  assert.deepEqual(desviosDoContrato('conta', { ...conta, email: null }), ['/email: devia ser string, veio null']);
});

test('contratos: a conta nunca pode trazer a password', () => {
  const desvios = desviosDoContrato('conta', { ...conta, password: 'segredo' });
  assert.equal(desvios.length, 1);
  assert.match(desvios[0], /nunca devia vir/);
  assert.doesNotMatch(desvios.join(), /segredo/, 'a mensagem não pode mostrar o valor');
});

test('contratos: o mesmo desvio em vários produtos de uma lista aparece uma vez, com a contagem', () => {
  const { slug, ...marcaSemSlug } = marca;
  const semSlug = { ...produto, brand: marcaSemSlug };
  const pagina = { current_page: 1, data: [semSlug, semSlug, semSlug], from: 1, last_page: 1, per_page: 9, to: 3, total: 3 };
  assert.deepEqual(desviosDoContrato('página de produtos', pagina), ['/data/*/brand: falta o campo "slug" (3×)']);
});

test('contratos: um contrato desconhecido falha e lista os que existem', () => {
  assert.throws(() => desviosDoContrato('carrinho', {}), /Contratos em contratos\/: .*produto/);
});
