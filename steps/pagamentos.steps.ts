import { When, Then, DataTable } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import type { MundoToolshop } from '../support/world';
import { comprarCarrinho, faturaDaCompra, moradaIndicada } from '../support/faturas';
import { validade, type MetodoDePagamento } from '../support/pagamentos';

// Todos os campos da resposta (a qualquer profundidade) cujo nome corresponde ao padrão,
// com o caminho até eles. Serve para procurar dados sensíveis sem depender da estrutura.
function camposComNome(valor: unknown, padrao: RegExp, caminho = 'fatura'): { caminho: string; valor: unknown }[] {
  if (valor === null || typeof valor !== 'object') {
    return [];
  }
  return Object.entries(valor).flatMap(([nome, filho]) => [
    ...(padrao.test(nome) ? [{ caminho: `${caminho}.${nome}`, valor: filho }] : []),
    ...camposComNome(filho, padrao, `${caminho}.${nome}`),
  ]);
}

When('finalizo a compra pagando com {metodo}', async function (this: MundoToolshop, metodo: MetodoDePagamento) {
  await comprarCarrinho(this, moradaIndicada(this), metodo);
});

Then('a fatura regista o pagamento com {metodo}', async function (this: MundoToolshop, metodo: MetodoDePagamento) {
  const fatura = await faturaDaCompra(this);
  expect(fatura.payment?.payment_method, `a fatura devia registar o pagamento com ${metodo.nome}`).toBe(
    metodo.metodo,
  );
});

When('finalizo a compra pagando com o cartão de crédito:', async function (this: MundoToolshop, tabela: DataTable) {
  const cartao = tabela.rowsHash();
  this.cartaoDaCompra = { numero: cartao['número'], cvv: cartao['código de segurança'] };

  await comprarCarrinho(this, moradaIndicada(this), {
    metodo: 'credit-card',
    detalhes: {
      credit_card_number: cartao['número'],
      expiration_date: validade(cartao['validade']),
      cvv: cartao['código de segurança'],
      card_holder_name: cartao['titular'],
    },
  });
});

Then('a fatura não mostra o código de segurança do cartão', async function (this: MundoToolshop) {
  const fatura = await faturaDaCompra(this);
  // Pré-condição: a fatura tem o pagamento com cartão; senão não estaríamos a olhar para o sítio certo.
  expect(fatura.payment?.payment_method, 'a fatura devia indicar o pagamento com cartão').toBe('credit-card');

  // Nenhum campo com nome de código de segurança pode ter valor.
  const comValor = camposComNome(fatura, /cvv|cvc|security_code/i).filter((c) => c.valor !== null && c.valor !== '');
  expect(comValor, 'campos com o código de segurança do cartão').toEqual([]);
});

Then('a fatura não mostra o número completo do cartão', async function (this: MundoToolshop) {
  const fatura = await faturaDaCompra(this);
  expect(fatura.payment?.payment_method, 'a fatura devia indicar o pagamento com cartão').toBe('credit-card');

  // O número não pode aparecer em lado nenhum: nem com hífenes, nem só com algarismos.
  const texto = JSON.stringify(fatura);
  const numero = this.cartaoDaCompra!.numero;
  expect(texto, 'a fatura não devia ter o número completo do cartão').not.toContain(numero);
  expect(texto, 'a fatura não devia ter o número completo do cartão').not.toContain(numero.replace(/-/g, ''));
});