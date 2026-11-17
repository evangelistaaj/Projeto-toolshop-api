# language: pt
@so-local
Funcionalidade: Compra com fatura
  Como cliente da Toolshop
  Quero finalizar a compra do meu carrinho
  Para receber os produtos e a respetiva fatura
  # Cada cenário compra um produto criado só para ele, com stock conhecido,
  # para não depender nem gastar o stock dos dados iniciais.
  # O distrito é escrito pelo cliente: para PT, a pesquisa de morada
  # devolve-o vazio (issue #2).

  Contexto:
    Dado que fiz login com a conta de cliente de demonstração

  Cenário: Comprar com a morada sugerida pelo código postal
    Dado que tenho no carrinho a quantidade 2 de um produto de teste com stock 5
    Quando compro o carrinho com a morada sugerida para "1000-001" em "PT" e o distrito "Lisboa"
    Então a fatura é criada com os produtos do carrinho

  Regra: A cidade tem de corresponder ao código postal

    Contexto:
      Dado que tenho no carrinho a quantidade 1 de um produto de teste com stock 5

    Cenário: A compra com uma cidade que não corresponde ao código postal é recusada
      Quando compro o carrinho com o código postal "1000-001" em "PT", a cidade "Lisboa" e o distrito "Lisboa"
      Então a compra é recusada
    # Bug: o erro aponta para o país (billing_country). Ver issue #5:
    # https://github.com/evangelistaaj/Projeto-toolshop-api/issues/5

    @bug-conhecido
    Cenário: O erro de uma cidade que não corresponde ao código postal aponta para a cidade
      Quando compro o carrinho com o código postal "1000-001" em "PT", a cidade "Lisboa" e o distrito "Lisboa"
      Então o erro da compra aponta para a cidade
    # Bug: a mensagem diz que a cidade não pertence ao país. Ver issue #5:
    # https://github.com/evangelistaaj/Projeto-toolshop-api/issues/5

    @bug-conhecido
    Cenário: A mensagem de erro explica que a cidade não corresponde ao código postal
      Quando compro o carrinho com o código postal "1000-001" em "PT", a cidade "Lisboa" e o distrito "Lisboa"
      Então a mensagem de erro da compra refere o código postal
    # Bug: os erros das faturas não seguem o formato do resto da API. Ver issue #6:
    # https://github.com/evangelistaaj/Projeto-toolshop-api/issues/6

    @bug-conhecido
    Cenário: O erro de uma cidade que não corresponde ao código postal segue o formato da API
      Quando compro o carrinho com o código postal "1000-001" em "PT", a cidade "Lisboa" e o distrito "Lisboa"
      Então o erro da compra segue o formato de erros da API

  Regra: O distrito é obrigatório

    Contexto:
      Dado que tenho no carrinho a quantidade 1 de um produto de teste com stock 5

    Cenário: A compra sem distrito é recusada
      Quando compro o carrinho com a morada sugerida para "1000-001" em "PT" e o distrito ""
      Então a compra é recusada
    # Bug: a mensagem diz "must be a string" em vez de dizer que o distrito é
    # obrigatório. Ver issue #7:
    # https://github.com/evangelistaaj/Projeto-toolshop-api/issues/7

    @bug-conhecido
    Cenário: A mensagem de erro diz que o distrito é obrigatório
      Quando compro o carrinho com a morada sugerida para "1000-001" em "PT" e o distrito ""
      Então a mensagem de erro da compra diz que o distrito é obrigatório
    # Bug: os erros das faturas não seguem o formato do resto da API. Ver issue #6:
    # https://github.com/evangelistaaj/Projeto-toolshop-api/issues/6

    @bug-conhecido
    Cenário: O erro da compra sem distrito segue o formato da API
      Quando compro o carrinho com a morada sugerida para "1000-001" em "PT" e o distrito ""
      Então o erro da compra segue o formato de erros da API

  Regra: O número da fatura segue a numeração da loja

    Cenário: O número da fatura começa pelo ano atual
      Dado que tenho no carrinho a quantidade 1 de um produto de teste com stock 5
      Quando compro o carrinho com a morada sugerida para "1000-001" em "PT" e o distrito "Lisboa"
      Então o número da fatura começa pelo ano atual

    Cenário: Duas compras seguidas têm números de fatura consecutivos
      Quando faço duas compras seguidas
      Então os números das duas faturas são consecutivos

    # Bug: as faturas novas têm 6 algarismos de sequência; as da loja têm 7.
    # Ver issue #8:
    # https://github.com/evangelistaaj/Projeto-toolshop-api/issues/8
    @bug-conhecido
    Cenário: O número da fatura tem o formato das faturas da loja
      Dado que tenho no carrinho a quantidade 1 de um produto de teste com stock 5
      Quando compro o carrinho com a morada sugerida para "1000-001" em "PT" e o distrito "Lisboa"
      Então o número da fatura tem o formato INV-ano-sequência de 7 algarismos
