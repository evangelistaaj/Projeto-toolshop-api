import { defineParameterType } from '@cucumber/cucumber';
import type { Pagamento } from './faturas';
import { lerDados } from './dados';

// Converte uma validade escrita no cenário no formato da API (MM/AAAA), a partir da data de hoje.
// Formas aceites: "este mês", "o mês passado" e "daqui a N anos". Assim os cenários nunca caducam.
export function validade(texto: string): string {
  const daquiA = texto.match(/^daqui a (\d+) anos?$/);
  let meses: number;
  if (texto === 'este mês') {
    meses = 0;
  } else if (texto === 'o mês passado') {
    meses = -1;
  } else if (daquiA) {
    meses = Number(daquiA[1]) * 12;
  } else {
    throw new Error(`Validade "${texto}" não reconhecida. Use "este mês", "o mês passado" ou "daqui a N anos".`);
  }
  // Conta em meses desde o ano 0, para não haver erros na passagem de ano (janeiro − 1 = dezembro do ano anterior).
  const hoje = new Date();
  const total = hoje.getFullYear() * 12 + hoje.getMonth() + meses;
  const mes = String((total % 12) + 1).padStart(2, '0');
  return `${mes}/${Math.floor(total / 12)}`;
}

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
