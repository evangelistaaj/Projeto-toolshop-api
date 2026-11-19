import { When, Then, DataTable } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import type { MundoToolshop } from '../support/world';
import { comprarCarrinho, faturaDaCompra, moradaIndicada } from '../support/faturas';
import { campoDaApi, detalhesDoPagamento, validade, type MetodoDePagamento } from '../support/pagamentos';
import { corpoSeguro } from '../support/seguranca';

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

// Caminhos dos valores da resposta (a qualquer profundidade) que contêm algum dos textos procurados.
// Devolve só os caminhos, para as mensagens de falha nunca mostrarem o dado sensível.
function caminhosQueContem(valor: unknown, procurados: string[], caminho = 'fatura'): string[] {
  if (typeof valor === 'string' || typeof valor === 'number') {
    return procurados.some((p) => String(valor).includes(p)) ? [caminho] : [];
  }
  if (valor === null || typeof valor !== 'object') {
    return [];
  }
  return Object.entries(valor).flatMap(([nome, filho]) => caminhosQueContem(filho, procurados, `${caminho}.${nome}`));
}

When('finalizo a compra pagando com {metodo}', async function (this: MundoToolshop, metodo: MetodoDePagamento) {
  await comprarCarrinho(this, moradaIndicada(this), metodo);
});

// Compra com os dados de pagamento indicados no cenário (campo | valor), válidos ou não.
When('finalizo a compra pagando com {metodo}:', async function (this: MundoToolshop, metodo: MetodoDePagamento, tabela: DataTable) {
  await comprarCarrinho(this, moradaIndicada(this), {
    metodo: metodo.metodo,
    detalhes: detalhesDoPagamento(tabela.rowsHash()),
  });
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