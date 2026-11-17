# language: pt
@so-local
Funcionalidade: Carrinho de compras
  Como visitante da Toolshop
  Quero juntar produtos ao carrinho e ajustar as quantidades
  Para preparar a minha compra

  Contexto:
    Dado que tenho um carrinho vazio

  Esquema do Cenário: Juntar um produto ao carrinho com a quantidade <quantidade>
    Quando junto ao carrinho um produto do catálogo com a quantidade <quantidade>
    Então o carrinho tem esse produto com a quantidade <quantidade>

    Exemplos:
      | quantidade |
      |          1 |
      |         10 |

  Esquema do Cenário: Juntar um produto com a quantidade inválida <quantidade>
    Quando junto ao carrinho um produto do catálogo com a quantidade <quantidade>
    Então recebo uma resposta com o código 422

    Exemplos:
      | quantidade |
      |          0 |
      |         -1 |

  Cenário: Alterar a quantidade de um produto no carrinho
    Dado que o carrinho tem um produto do catálogo com a quantidade 2
    Quando altero a quantidade desse produto para 5
    Então o carrinho tem esse produto com a quantidade 5

  Cenário: Remover um produto do carrinho
    Dado que o carrinho tem um produto do catálogo com a quantidade 2
    Quando removo esse produto do carrinho
    Então o carrinho fica vazio

  Cenário: Juntar um produto que não existe
    Quando junto ao carrinho um produto que não existe
    Então recebo uma resposta com o código 422
