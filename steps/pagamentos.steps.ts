import { When, Then, DataTable } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import type { MundoToolshop } from '../support/world';
import { comprarCarrinho, faturaDaCompra, moradaIndicada } from '../support/faturas';
import { campoDaApi, detalhesDoPagamento, type MetodoDePagamento } from '../support/pagamentos';
import { camposComNome, caminhosQueContem } from '../support/oraculos';
import { corpoSeguro } from '../support/seguranca';

When('finalizo a compra pagando com {metodo}', async function (this: MundoToolshop, metodo: MetodoDePagamento) {
  await comprarCarrinho(this, moradaIndicada(this), metodo);
});

// Compra com os dados de pagamento indicados no cenário (campo | valor), válidos ou não.
When('finalizo a compra pagando com {metodo}:', async function (this: MundoToolshop, metodo: MetodoDePagamento, tabela: DataTable) {
  const dados = tabela.rowsHash();
  // Guarda o cartão usado (se houver), para depois verificar que a fatura não o expõe.
  if (dados['número']) {
    this.cartaoDaCompra = { numero: dados['número'], cvv: dados['código de segurança'] };
  }
  await comprarCarrinho(this, moradaIndicada(this), {
    metodo: metodo.metodo,
    detalhes: detalhesDoPagamento(dados),
  });
});

Then('a fatura regista o pagamento com {metodo}', async function (this: MundoToolshop, metodo: MetodoDePagamento) {
  const fatura = await faturaDaCompra(this);
  expect(fatura.payment?.payment_method, `a fatura devia registar o pagamento com ${metodo.nome}`).toBe(
    metodo.metodo,
  );
});

Then('a fatura não mostra o código de segurança do cartão', async function (this: MundoToolshop) {
  const fatura = await faturaDaCompra(this);
  // Pré-condição: a fatura tem o pagamento com cartão; senão não estaríamos a olhar para o sítio certo.
  expect(fatura.payment?.payment_method, 'a fatura devia indicar o pagamento com cartão').toBe('credit-card');

  // Nenhum campo com nome de código de segurança pode ter valor.
  // A mensagem mostra só onde estão, nunca o valor.
  const comValor = camposComNome(fatura, /cvv|cvc|security_code/i)
    .filter((c) => c.valor !== null && c.valor !== '')
    .map((c) => c.caminho);
  expect(comValor, 'campos com o código de segurança do cartão (valores ocultos)').toEqual([]);
});

Then('a fatura não mostra o número completo do cartão', async function (this: MundoToolshop) {
  const fatura = await faturaDaCompra(this);
  expect(fatura.payment?.payment_method, 'a fatura devia indicar o pagamento com cartão').toBe('credit-card');

  // O número não pode aparecer em lado nenhum: nem com hífenes, nem só com algarismos.
  // A mensagem mostra só onde aparece, nunca o número.
  const numero = this.cartaoDaCompra!.numero;
  const expostos = caminhosQueContem(fatura, [numero, numero.replace(/-/g, '')]);
  expect(expostos, 'campos com o número completo do cartão (valores ocultos)').toEqual([]);
});

// Verificação do pagamento antes da compra: não precisa de login nem de carrinho.
When('verifico o pagamento com {metodo}:', async function (this: MundoToolshop, metodo: MetodoDePagamento, tabela: DataTable) {
  this.resposta = await this.api.post('/payment/check', {
    data: { payment_method: metodo.metodo, payment_details: detalhesDoPagamento(tabela.rowsHash()) },
  });
});

Then('o pagamento é aceite', async function (this: MundoToolshop) {
  expect(this.resposta!.status(), await corpoSeguro(this.resposta!)).toBe(200);
  expect((await this.resposta!.json()).message, 'mensagem da verificação').toBe('Payment was successful');
});

// A recusa tem de ser por causa do campo indicado, e só dele: os outros campos do exemplo são válidos.
Then('o pagamento é recusado por causa do campo {string}', async function (this: MundoToolshop, campo: string) {
  expect(this.resposta!.status(), await corpoSeguro(this.resposta!)).toBe(422);
  const corpo = await this.resposta!.json();
  expect(Object.keys(corpo.errors ?? {}), `só o campo "${campo}" devia ser recusado`).toEqual([
    `payment_details.${campoDaApi(campo)}`,
  ]);
});