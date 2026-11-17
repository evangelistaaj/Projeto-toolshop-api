# language: pt
Funcionalidade: Pesquisa de morada por código postal
  Como cliente da Toolshop
  Quero que a minha morada seja preenchida a partir do código postal
  Para fazer as minhas compras sem erros na morada

  # "Morada completa": rua, cidade e distrito preenchidos, com o país e o
  # código postal iguais aos pesquisados.

  Esquema do Cenário: A morada de <pais> vem completa
    Quando pesquiso a morada do código postal "<codigo_postal>" em "<pais>"
    Então recebo uma morada completa em "<pais>"

    Exemplos:
      | pais | codigo_postal |
      | DE   | 10115         |
      | ES   | 28001         |
      | BR   | 01001-000     |

  # Bug: a pesquisa devolve o distrito vazio para estes países, e o distrito
  # é obrigatório na fatura. Ver issue #2:
  # https://github.com/evangelistaaj/Projeto-toolshop-api/issues/2
  @bug-conhecido
  Esquema do Cenário: A morada de <pais> devia vir completa
    Quando pesquiso a morada do código postal "<codigo_postal>" em "<pais>"
    Então recebo uma morada completa em "<pais>"

    Exemplos:
      | pais | codigo_postal |
      | PT   | 1000-001      |
      | FR   | 75001         |
      | GB   | SW1A 1AA      |

  # Bug: a pesquisa devolve o distrito vazio para estes países, e o distrito
  # é obrigatório na fatura. Ver issue #2:
  # https://github.com/evangelistaaj/Projeto-toolshop-api/issues/2
  @bug-conhecido
  Cenário: Pesquisar a morada num país que não existe
    Quando pesquiso a morada do código postal "123" em "XX"
    Então recebo uma resposta com o código 422

  # Bug: o registo exige o formato 0000-000 para Portugal, mas a pesquisa
  # aceita outros formatos. Ver issue #3:
  # https://github.com/evangelistaaj/Projeto-toolshop-api/issues/3
  @bug-conhecido
  Cenário: Pesquisar um código postal português com formato inválido
    Quando pesquiso a morada do código postal "1000" em "PT"
    Então recebo uma resposta com o código 422

  # Bug: a pesquisa devolve um estado dos EUA (ex.: "Illinois") para moradas
  # argentinas. Ver issue #4:
  # https://github.com/evangelistaaj/Projeto-toolshop-api/issues/4
  @bug-conhecido
  Cenário: A morada da Argentina vem com uma província argentina
    Quando pesquiso a morada do código postal "C1000" em "AR"
    Então o distrito da morada é uma província da Argentina