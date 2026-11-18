import { Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import type { MundoToolshop } from '../support/world';
import { faturaDaCompra, subtotalDoCarrinho } from '../support/faturas';

// Verifica o desconto ecológico da fatura e as contas que dependem dele:
// subtotal = soma das linhas; desconto = subtotal × percentagem; total = subtotal − desconto.
async function verificarDescontoEcologico(mundo: MundoToolshop, percentagem: number) {
  const fatura = await faturaDaCompra(mundo);
  const subtotal = subtotalDoCarrinho(mundo);
  const desconto = (subtotal * percentagem) / 100;

  expect(Number(fatura.subtotal), 'subtotal = soma de preço × quantidade').toBeCloseTo(subtotal, 2);
  expect(Number(fatura.eco_discount_percentage ?? 0), 'percentagem do desconto ecológico').toBe(percentagem);
  expect(Number(fatura.eco_discount_amount ?? 0), 'valor do desconto ecológico').toBeCloseTo(desconto, 2);
  expect(Number(fatura.total), 'total = subtotal − desconto').toBeCloseTo(subtotal - desconto, 2);
}

Then('a fatura tem um desconto ecológico de {int}%', async function (this: MundoToolshop, percentagem: number) {
  await verificarDescontoEcologico(this, percentagem);
});

Then('a fatura não tem desconto ecológico', async function (this: MundoToolshop) {
  await verificarDescontoEcologico(this, 0);
});

// Valores de dinheiro da fatura que têm de bater certo.
const VALORES = ['subtotal', 'eco_discount_percentage', 'eco_discount_amount', 'total'] as const;

// Um valor de dinheiro em cêntimos (inteiro), para comparar sem erros de vírgula flutuante.
function centimos(valor: unknown): number {
  return Math.round(Number(valor ?? 0) * 100);
}

Then('a fatura devolvida na compra tem os mesmos valores da fatura guardada', async function (this: MundoToolshop) {
  const guardada = await faturaDaCompra(this);
  const devolvida = await this.resposta!.json();

  // Comparação exata dos valores tal como vêm: o cliente que mostra a resposta
  // da compra tem de mostrar o mesmo que a fatura consultada depois.
  const valores = (fatura: Record<string, unknown>) =>
    Object.fromEntries(VALORES.map((campo) => [campo, Number(fatura[campo] ?? 0)]));
  expect(valores(devolvida), 'valores da resposta da compra = valores da fatura guardada').toEqual(valores(guardada));
});

Then('o total da fatura é o subtotal menos os descontos, ao cêntimo', async function (this: MundoToolshop) {
  const fatura = await faturaDaCompra(this);

  // Pré-condição: o subtotal é a soma do carrinho e há desconto ecológico,
  // senão o cenário não testa o arredondamento.
  expect(centimos(fatura.subtotal), 'subtotal = soma de preço × quantidade').toBe(
    centimos(subtotalDoCarrinho(this)),
  );
  expect(centimos(fatura.eco_discount_amount), 'a fatura devia ter desconto ecológico').toBeGreaterThan(0);

  const esperado =
    centimos(fatura.subtotal) - centimos(fatura.additional_discount_amount) - centimos(fatura.eco_discount_amount);
  expect(
    centimos(fatura.total),
    `total (${fatura.total}) = subtotal (${fatura.subtotal}) − descontos (${fatura.additional_discount_amount ?? 0} + ${fatura.eco_discount_amount})`,
  ).toBe(esperado);
});
