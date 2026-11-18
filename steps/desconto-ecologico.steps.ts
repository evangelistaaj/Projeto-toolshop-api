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
