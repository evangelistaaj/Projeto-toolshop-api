import { Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import type { MundoToolshop } from '../support/world';
import { faturaDaCompra } from '../support/faturas';
import { corpoSeguro } from '../support/seguranca';

// Servidor de email de testes (mailcatcher): recebe os emails da Toolshop sem os enviar.
const MAIL_URL = process.env.MAIL_URL ?? 'http://localhost:1080';

type Mensagem = { id: number; recipients: string[] };

// O email de confirmação desta compra, em texto simples, ou undefined se ainda não chegou.
// O servidor guarda os emails de todas as execuções; o desta compra é o que menciona
// todos os produtos do cenário, que têm nomes únicos.
async function emailDaCompra(mundo: MundoToolshop): Promise<string | undefined> {
  const lista = await mundo.api.get(`${MAIL_URL}/messages`);
  expect(lista.status(), 'o servidor de email de testes devia responder (está a correr?)').toBe(200);

  const doCliente = ((await lista.json()) as Mensagem[])
    .filter((m) => m.recipients.some((r) => r.includes(mundo.emailLogin!)))
    .reverse() // os mais recentes primeiro
    .slice(0, 10);

  for (const mensagem of doCliente) {
    const resposta = await mundo.api.get(`${MAIL_URL}/messages/${mensagem.id}.plain`, {
      headers: { Accept: 'text/plain' },
    });
    const texto = await resposta.text();
    if (mundo.produtosNoCarrinho!.every((p) => texto.includes(p.nome))) {
      return texto;
    }
  }
  return undefined;
}

// Texto do email já recebido (o passo "recebo um email de confirmação" tem de vir antes).
function textoDoEmail(mundo: MundoToolshop): string {
  if (!mundo.textoDoEmail) {
    throw new Error('Este passo precisa do email antes ("recebo um email de confirmação ...").');
  }
  return mundo.textoDoEmail;
}

// Converte um valor do email ("1,234.50") num número.
function valor(texto: string): number {
  return Number(texto.replace(/,/g, ''));
}

Then(
  'recebo um email de confirmação com todos os produtos comprados',
  { timeout: 120_000 },
  async function (this: MundoToolshop) {
    // A compra tem de ter sido aceite; senão, não há email a esperar.
    expect(this.resposta!.status(), await corpoSeguro(this.resposta!)).toBe(201);

    // O email é enviado em segundo plano (fila + agendador de minuto a minuto):
    // repetimos a procura até ele chegar, sem esperas fixas.
    await expect
      .poll(
        async () => {
          this.textoDoEmail = await emailDaCompra(this);
          return this.textoDoEmail !== undefined;
        },
        { message: 'o email de confirmação devia chegar até 90 s depois da compra', timeout: 90_000, intervals: [5_000] },
      )
      .toBe(true);

    // Cada produto aparece numa linha "<quantidade> x <nome>".
    for (const produto of this.produtosNoCarrinho!) {
      expect(textoDoEmail(this), `o email devia ter a linha "${produto.quantidade} x ${produto.nome}"`).toContain(
        `${produto.quantidade} x ${produto.nome}`,
      );
    }
  },
);

Then('o total do email é o total da fatura', async function (this: MundoToolshop) {
  const fatura = await faturaDaCompra(this);
  const total = textoDoEmail(this).match(/Total: \$ ([\d,]+\.\d{2})/);
  expect(total, 'o email devia ter uma linha "Total: $ ..."').not.toBeNull();
  expect(valor(total![1]), 'total do email').toBeCloseTo(Number(fatura.total), 2);
});

Then('o email mostra o desconto ecológico da fatura', async function (this: MundoToolshop) {
  const fatura = await faturaDaCompra(this);
  // Pré-condição: a compra tem desconto ecológico; senão, o email não teria de o mostrar.
  expect(Number(fatura.eco_discount_percentage ?? 0), 'a fatura devia ter desconto ecológico').toBeGreaterThan(0);

  // Formato da linha tirado do próprio modelo de email da Toolshop (Checkout_plain.blade.php).
  const linha = textoDoEmail(this).match(/Eco-Friendly Discount \((\d+)%\): -\$ ([\d,]+\.\d{2})/);
  expect(linha, 'o email devia ter a linha "Eco-Friendly Discount (...%): -$ ..."').not.toBeNull();
  expect(Number(linha![1]), 'percentagem do desconto no email').toBe(Number(fatura.eco_discount_percentage));
  expect(valor(linha![2]), 'valor do desconto no email').toBeCloseTo(Number(fatura.eco_discount_amount), 2);
});

Then('o email indica o número da fatura', async function (this: MundoToolshop) {
  const fatura = await faturaDaCompra(this);
  expect(textoDoEmail(this), `o email devia indicar o número da fatura (${fatura.invoice_number})`).toContain(
    fatura.invoice_number,
  );
});
