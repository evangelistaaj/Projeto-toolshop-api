# language: pt
@so-local
Funcionalidade: Métodos de pagamento
  Como cliente da Toolshop
  Quero pagar as compras com o método que prefiro
  Para comprar da forma que me dá mais jeito

  Regra: Cada método de pagamento fica registado na fatura

    Contexto:
      Dado que fiz login com a conta de cliente de demonstração
      E que tenho no carrinho os produtos:
        | quantidade | preço | CO2 |
        |          1 | 10.00 | D   |
      E que indico a morada sugerida para o código postal "1000-001" de "Portugal"
      E que indico o distrito "Lisboa"

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

  Regra: A verificação do pagamento recusa dados inválidos
    Antes de finalizar a compra, a loja verifica os dados do pagamento.
    Cada exemplo parte de dados válidos e muda só um campo, para que uma
    recusa só possa ter uma causa.

    Esquema do Cenário: Um cartão de crédito com <caso> é aceite
      Quando verifico o pagamento com cartão de crédito:
        | número              | <numero>   |
        | validade            | <validade> |
        | código de segurança | <cvv>      |
        | titular             | <titular>  |
      Então o pagamento é aceite

      Exemplos:
        | caso                                | numero              | validade       | cvv  | titular   |
        | dados válidos                       | 4111-1111-1111-1111 | daqui a 2 anos |  123 | Jack Howe |
        | código de segurança de 4 algarismos | 4111-1111-1111-1111 | daqui a 2 anos | 4321 | Jack Howe |

      @bug-conhecido @issue-15
      Exemplos: no mês da validade
        Bug: a validade MM/AAAA é lida como o dia 1 desse mês, por isso o cartão
        é recusado durante todo o mês em que ainda é válido.
        https://github.com/evangelistaaj/Projeto-toolshop-api/issues/15
        | caso                  | numero              | validade | cvv | titular   |
        | validade no mês atual | 4111-1111-1111-1111 | este mês | 123 | Jack Howe |

    Esquema do Cenário: Um cartão de crédito com <caso> é recusado
      Quando verifico o pagamento com cartão de crédito:
        | número              | <numero>   |
        | validade            | <validade> |
        | código de segurança | <cvv>      |
        | titular             | <titular>  |
      Então o pagamento é recusado por causa do campo "<campo>"

      Exemplos:
        | caso                                | numero              | validade       | cvv   | titular     | campo               |
        | validade no mês passado             | 4111-1111-1111-1111 | o mês passado  |   123 | Jack Howe   | validade            |
        | código de segurança de 2 algarismos | 4111-1111-1111-1111 | daqui a 2 anos |    12 | Jack Howe   | código de segurança |
        | código de segurança de 5 algarismos | 4111-1111-1111-1111 | daqui a 2 anos | 12345 | Jack Howe   | código de segurança |
        | número sem hífenes                  |    4111111111111111 | daqui a 2 anos |   123 | Jack Howe   | número              |
        | número com letras                   | 4111-1111-1111-ABCD | daqui a 2 anos |   123 | Jack Howe   | número              |
        | titular com algarismos              | 4111-1111-1111-1111 | daqui a 2 anos |   123 | Jack Howe 2 | titular             |

    Cenário: Uma transferência bancária com dados válidos é aceite
      Quando verifico o pagamento com transferência bancária:
        | banco            | Banco Exemplo |
        | titular da conta | Jack Howe     |
        | número da conta  |     123456789 |
      Então o pagamento é aceite

    Cenário: Uma transferência bancária com letras no número da conta é recusada
      Quando verifico o pagamento com transferência bancária:
        | banco            | Banco Exemplo |
        | titular da conta | Jack Howe     |
        | número da conta  |     12345678A |
      Então o pagamento é recusado por causa do campo "número da conta"

    Cenário: Um cartão-oferta com dados válidos é aceite
      Quando verifico o pagamento com cartão-oferta:
        | número do cartão-oferta | ABCD1234EFGH5678 |
        | código de validação     | AB12             |
      Então o pagamento é aceite

    Esquema do Cenário: Um cartão-oferta com <caso> é recusado
      Quando verifico o pagamento com cartão-oferta:
        | número do cartão-oferta | <numero> |
        | código de validação     | <codigo> |
      Então o pagamento é recusado por causa do campo "<campo>"

      Exemplos:
        | caso                                | numero            | codigo | campo                   |
        | número de 15 caracteres             | ABCD1234EFGH567   | AB12   | número do cartão-oferta |
        | número de 17 caracteres             | ABCD1234EFGH56789 | AB12   | número do cartão-oferta |
        | código de validação de 3 caracteres | ABCD1234EFGH5678  | AB1    | código de validação     |

  Regra: A compra recusa dados de pagamento inválidos
    A verificação do pagamento é um pedido à parte, que quem chama a API
    diretamente pode saltar. Por isso a compra tem de recusar, ela própria,
    os mesmos dados que a verificação recusa.

    Contexto:
      Dado que fiz login com a conta de cliente de demonstração
      E que tenho no carrinho os produtos:
        | quantidade | preço | CO2 |
        |          1 | 10.00 | D   |
      E que indico a morada sugerida para o código postal "1000-001" de "Portugal"
      E que indico o distrito "Lisboa"

    @bug-conhecido @issue-16
    Esquema do Cenário: Comprar com um cartão de crédito com <caso> é recusado
      Bug: a compra não valida os dados do cartão (só os do cartão-oferta),
      e aceita dados que a verificação do pagamento recusa.
      https://github.com/evangelistaaj/Projeto-toolshop-api/issues/16

      Quando finalizo a compra pagando com cartão de crédito:
        | número              | <numero>   |
        | validade            | <validade> |
        | código de segurança | <cvv>      |
        | titular             | <titular>  |
      Então a compra é recusada

      Exemplos:
        | caso                                | numero              | validade       | cvv | titular   |
        | número com letras                   | 4111-1111-1111-ABCD | daqui a 2 anos | 123 | Jack Howe |
        | validade no mês passado             | 4111-1111-1111-1111 | o mês passado  | 123 | Jack Howe |
        | código de segurança de 2 algarismos | 4111-1111-1111-1111 | daqui a 2 anos |  12 | Jack Howe |

    @bug-conhecido @issue-16
    Cenário: Comprar com uma transferência bancária com letras no número da conta é recusado
      Bug: a compra não valida os dados da transferência (só os do
      cartão-oferta), e aceita dados que a verificação do pagamento recusa.
      https://github.com/evangelistaaj/Projeto-toolshop-api/issues/16

      Quando finalizo a compra pagando com transferência bancária:
        | banco            | Banco Exemplo |
        | titular da conta | Jack Howe     |
        | número da conta  |     12345678A |
      Então a compra é recusada

    Cenário: Comprar com um cartão-oferta de 15 caracteres é recusado
      Quando finalizo a compra pagando com cartão-oferta:
        | número do cartão-oferta | ABCD1234EFGH567 |
        | código de validação     | AB12            |
      Então a compra é recusada

  Regra: A fatura não expõe os dados sensíveis do cartão
    As regras de segurança dos pagamentos com cartão (PCI DSS) não permitem
    guardar o código de segurança (CVV) depois do pagamento, e o número do
    cartão só pode ser mostrado mascarado.

    Contexto:
      Dado que fiz login com a conta de cliente de demonstração
      E que tenho no carrinho os produtos:
        | quantidade | preço | CO2 |
        |          1 | 10.00 | D   |
      E que indico a morada sugerida para o código postal "1000-001" de "Portugal"
      E que indico o distrito "Lisboa"

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
