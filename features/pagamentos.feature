# language: pt
@so-local
Funcionalidade: Métodos de pagamento
  Como cliente da Toolshop
  Quero pagar as compras com o método que prefiro
  Para comprar da forma que me dá mais jeito

  Contexto:
    Dado que fiz login com a conta de cliente de demonstração
    E que tenho no carrinho os produtos:
      | quantidade | preço | CO2 |
      |          1 | 10.00 | D   |
    E que indico a morada sugerida para o código postal "1000-001" de "Portugal"
    E que indico o distrito "Lisboa"

  Regra: Cada método de pagamento fica registado na fatura

    Esquema do Cenário: Comprar pagando com <metodo>
      Quando finalizo a compra pagando com <metodo>
      Então a fatura regista o pagamento com <metodo>

      Exemplos:
        | metodo                 |
        | contra-reembolso       |
        | cartão de crédito      |
        | transferência bancária |
        | cartão-oferta          |
        | pagamento a prestações |

  Regra: A fatura não expõe os dados sensíveis do cartão
    As regras de segurança dos pagamentos com cartão (PCI DSS) não permitem
    guardar o código de segurança (CVV) depois do pagamento, e o número do
    cartão só pode ser mostrado mascarado.

    @bug-conhecido @issue-14
    Esquema do Cenário: A fatura não mostra o código de segurança de um cartão com CVV de <algarismos> algarismos
      Bug: a API guarda o CVV e devolve-o na fatura, em
      payment.payment_details.cvv.
      https://github.com/evangelistaaj/Projeto-toolshop-api/issues/14

      Quando finalizo a compra pagando com o cartão de crédito:
        | número              | <numero>   |
        | validade            | <validade> |
        | código de segurança | <cvv>      |
        | titular             | <titular>  |
      Então a fatura não mostra o código de segurança do cartão

      Exemplos:
        | algarismos | numero              | validade       | cvv  | titular     |
        |          3 | 4111-1111-1111-1111 | daqui a 2 anos |  123 | Jack Howe   |
        |          4 | 5500-0000-0000-0004 | daqui a 5 anos | 4321 | Maria Silva |

    @bug-conhecido @issue-14
    Esquema do Cenário: A fatura não mostra o número completo do cartão <numero>
      Bug: a API guarda o número do cartão completo e devolve-o na fatura,
      sem mascarar.
      https://github.com/evangelistaaj/Projeto-toolshop-api/issues/14

      Quando finalizo a compra pagando com o cartão de crédito:
        | número              | <numero>       |
        | validade            | daqui a 2 anos |
        | código de segurança |            123 |
        | titular             | Jack Howe      |
      Então a fatura não mostra o número completo do cartão

      Exemplos:
        | numero              |
        | 4111-1111-1111-1111 |
        | 5500-0000-0000-0004 |
