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