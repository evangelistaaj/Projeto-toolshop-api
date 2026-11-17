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
    # Bug: o erro aponta para o país (billing_country). Ver issue (por abrir).

    @bug-conhecido
    Cenário: O erro de uma cidade que não corresponde ao código postal aponta para a cidade
      Quando compro o carrinho com o código postal "1000-001" em "PT", a cidade "Lisboa" e o distrito "Lisboa"
      Então o erro da compra aponta para a cidade
    # Bug: a mensagem diz que a cidade não pertence ao país. Ver issue (por abrir).

    @bug-conhecido
    Cenário: A mensagem de erro explica que a cidade não corresponde ao código postal
      Quando compro o carrinho com o código postal "1000-001" em "PT", a cidade "Lisboa" e o distrito "Lisboa"
      Então a mensagem de erro da compra refere o código postal
    # Bug: os erros das faturas não seguem o formato do resto da API. Ver issue (por abrir).

    @bug-conhecido
    Cenário: O erro de uma cidade que não corresponde ao código postal segue o formato da API
      Quando compro o carrinho com o código postal "1000-001" em "PT", a cidade "Lisboa" e o distrito "Lisboa"
      Então o erro da compra segue o formato de erros da API
