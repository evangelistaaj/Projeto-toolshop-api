# language: pt
Funcionalidade: Pesquisa de morada por código postal
  Como cliente da Toolshop
  Quero que a minha morada seja preenchida a partir do código postal
  Para fazer as minhas compras sem erros na morada

  "Morada completa": rua, cidade e distrito preenchidos, com o país e o
  código postal iguais aos pesquisados.

  Esquema do Cenário: A morada <onde> vem completa
    Quando pesquiso a morada do código postal "<codigo_postal>" em "<pais>"
    Então recebo uma morada completa em "<pais>"

    Exemplos:
      | onde        | pais     | codigo_postal |
      | na Alemanha | Alemanha | 10115         |
      | em Espanha  | Espanha  | 28001         |
      | no Brasil   | Brasil   | 01001-000     |

  @bug-conhecido @issue-2
  Esquema do Cenário: A morada <onde> devia vir completa
    Bug: a pesquisa devolve o distrito vazio para estes países, e o distrito
    é obrigatório na fatura.
    https://github.com/evangelistaaj/Projeto-toolshop-api/issues/2

    Quando pesquiso a morada do código postal "<codigo_postal>" em "<pais>"
    Então recebo uma morada completa em "<pais>"

    Exemplos:
      | onde           | pais        | codigo_postal |
      | em Portugal    | Portugal    | 1000-001      |
      | em França      | França      | 75001         |
      | no Reino Unido | Reino Unido | SW1A 1AA      |

  @bug-conhecido @issue-3
  Cenário: Pesquisar a morada num país que não existe
    Bug: a pesquisa inventa uma morada americana para um país que não existe.
    https://github.com/evangelistaaj/Projeto-toolshop-api/issues/3

    Quando pesquiso a morada do código postal "123" num país que não existe
    Então recebo uma resposta com o código 422

  @bug-conhecido @issue-3
  Cenário: Pesquisar um código postal português com formato inválido
    Bug: o registo exige o formato 0000-000 para Portugal, mas a pesquisa
    aceita outros formatos.
    https://github.com/evangelistaaj/Projeto-toolshop-api/issues/3

    Quando pesquiso a morada do código postal "1000" em "Portugal"
    Então recebo uma resposta com o código 422

  @bug-conhecido @issue-4
  Cenário: A morada da Argentina vem com uma província argentina
    Bug: a pesquisa devolve um estado dos EUA (ex.: "Illinois") para moradas
    argentinas.
    https://github.com/evangelistaaj/Projeto-toolshop-api/issues/4

    Quando pesquiso a morada do código postal "C1000" em "Argentina"
    Então o distrito da morada é uma província da Argentina
