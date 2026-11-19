import { defineParameterType } from '@cucumber/cucumber';
import type { Pagamento } from './faturas';

// Converte uma validade escrita no cenário ("daqui a 2 anos") no formato da API (MM/AAAA),
// a partir da data de hoje. Assim os cenários nunca caducam.
export function validade(texto: string): string {
  const hoje = new Date();
  const daquiA = texto.match(/^daqui a (\d+) anos?$/);
  if (!daquiA) {
    throw new Error(`Validade "${texto}" não reconhecida. Use, por exemplo, "daqui a 2 anos".`);
  }
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  const ano = hoje.getFullYear() + Number(daquiA[1]);
  return `${mes}/${ano}`;
}

// Dados válidos de exemplo de cada método, pelo nome usado no Gherkin.
// Nos cenários em que os dados não são o tema, ficam aqui e não no .feature.
// Formatos tirados das validações da Toolshop (PaymentController e GiftCard).
const METODOS: Record<string, Pagamento> = {
  'contra-reembolso': { metodo: 'cash-on-delivery', detalhes: {} },
  'cartão de crédito': {
    metodo: 'credit-card',
    detalhes: {
      credit_card_number: '4111-1111-1111-1111',
      expiration_date: validade('daqui a 2 anos'),
      cvv: '123',
      card_holder_name: 'Jack Howe',
    },
  },
  'transferência bancária': {
    metodo: 'bank-transfer',
    detalhes: { bank_name: 'Banco Exemplo', account_name: 'Jack Howe', account_number: '123456789' },
  },
  'cartão-oferta': {
    metodo: 'gift-card',
    detalhes: { gift_card_number: 'ABCD1234EFGH5678', validation_code: 'AB12' },
  },
  'pagamento a prestações': { metodo: 'buy-now-pay-later', detalhes: { monthly_installments: 3 } },
};

// Um método de pagamento com o nome em português, para as mensagens dos testes.
export type MetodoDePagamento = Pagamento & { nome: string };

// Tipo de parâmetro {metodo}: só aceita os nomes do dicionário e entrega o método já pronto.
// A expressão tem os nomes escritos por extenso (e não calculados a partir do dicionário),
// porque a extensão do Cucumber do VS Code lê o código sem o executar.
defineParameterType({
  name: 'metodo',
  regexp: /contra-reembolso|cartão de crédito|transferência bancária|cartão-oferta|pagamento a prestações/,
  transformer: (nome: string): MetodoDePagamento => {
    const pagamento = METODOS[nome];
    if (!pagamento) {
      throw new Error(`Método de pagamento "${nome}" sem dados de exemplo no dicionário METODOS.`);
    }
    return { nome, ...pagamento };
  },
});