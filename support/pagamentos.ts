import { defineParameterType } from '@cucumber/cucumber';
import type { Pagamento } from './faturas';
import { lerDados } from './dados';
import { validade } from './datas';

// Nome de cada campo de pagamento no Gherkin → nome do campo na API.
const CAMPOS: Record<string, string> = {
  'número': 'credit_card_number',
  'validade': 'expiration_date',
  'código de segurança': 'cvv',
  'titular': 'card_holder_name',
  'banco': 'bank_name',
  'titular da conta': 'account_name',
  'número da conta': 'account_number',
  'número do cartão-oferta': 'gift_card_number',
  'código de validação': 'validation_code',
  'prestações': 'monthly_installments',
};

// O nome na API de um campo escrito no Gherkin; falha com uma mensagem clara se não for conhecido.
export function campoDaApi(nome: string): string {
  const campo = CAMPOS[nome];
  if (!campo) {
    throw new Error(`Campo de pagamento "${nome}" desconhecido. Campos conhecidos: ${Object.keys(CAMPOS).join(', ')}.`);
  }
  return campo;
}

// Converte a tabela do cenário (campo | valor) nos dados de pagamento que a API espera.
// A validade é escrita de forma relativa no cenário e convertida aqui.
export function detalhesDoPagamento(tabela: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(tabela).map(([nome, valor]) => [campoDaApi(nome), nome === 'validade' ? validade(valor) : valor]),
  );
}

// Dados válidos de cada método, pelo nome usado no Gherkin (dados/pagamentos.json).
// Nos cenários em que os dados não são o tema, vêm daqui e não do .feature.
// Os formatos seguem as validações da Toolshop (PaymentController e GiftCard).
const METODOS: Record<string, Pagamento> = Object.fromEntries(
  Object.entries(
    lerDados<Record<string, { metodo: string; dados: Record<string, string> }>>('pagamentos.json'),
  ).map(([nome, { metodo, dados }]) => [nome, { metodo, detalhes: detalhesDoPagamento(dados) }]),
);

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
      throw new Error(`Método de pagamento "${nome}" sem dados em dados/pagamentos.json.`);
    }
    return { nome, ...pagamento };
  },
});
