# language: pt
Funcionalidade: Catálogo de produtos
  Como cliente da Toolshop
  Quero consultar o catálogo de produtos
  Para escolher as ferramentas de que preciso

  Cenário: Consultar o catálogo
    Quando consulto o catálogo de produtos
    Então recebo uma lista de produtos

  Regra: O catálogo é paginado, com 9 produtos por página
    A resposta indica a página, a posição dos produtos no catálogo ("do 10.º
    ao 18.º"), o total de produtos e a última página. O total muda de ambiente
    para ambiente, por isso os cenários usam o que a própria resposta indica.

    Cenário: A segunda página continua onde a primeira acabou
      Quando consulto a página 2 do catálogo
      Então a página 2 tem 9 produtos, do 10.º ao 18.º

    Cenário: Uma página depois da última vem vazia
      Quando consulto a página a seguir à última do catálogo
      Então a página vem vazia

    Esquema do Cenário: Percorrer o catálogo, com a ordem <ordem>, devolve cada produto uma só vez
      Quando percorro todas as páginas do catálogo, com a ordem "<ordem>"
      Então recebo cada produto do catálogo uma só vez

      Exemplos:
        | ordem             |
        | por omissão       |
        | nome crescente    |
        | preço decrescente |

  Regra: A ordenação vale para o catálogo inteiro, não só para a primeira página
    Os produtos com o mesmo valor podem vir em qualquer ordem. Os nomes comparam-se
    sem distinguir maiúsculas.

    Esquema do Cenário: Percorrer o catálogo por <ordem> devolve os produtos nessa ordem
      Quando percorro todas as páginas do catálogo, com a ordem "<ordem>"
      Então os produtos vêm ordenados por "<ordem>"

      Exemplos:
        | ordem             |
        | nome crescente    |
        | nome decrescente  |
        | preço crescente   |
        | preço decrescente |

  Regra: A pesquisa procura no nome dos produtos
    Sem distinguir maiúsculas e aceitando parte de uma palavra. Inclui os produtos de
    aluguer. O resultado é comparado com o catálogo completo, percorrido à parte: têm de
    vir exatamente os produtos cujo nome contém o termo, nem mais nem menos.

    Esquema do Cenário: Pesquisar por "<termo>" devolve os produtos com esse nome
      Quando pesquiso no catálogo por "<termo>"
      Então recebo exatamente os produtos do catálogo que cumprem o filtro

      Exemplos:
        | termo  |
        | pliers |
        | PLIERS |
        | plie   |
        | crane  |

    Cenário: Pesquisar um termo que nenhum produto tem
      Quando pesquiso no catálogo por "xyzinexistente"
      Então não recebo nenhum produto

  Regra: Os filtros devolvem exatamente os produtos do catálogo que os cumprem
    O resultado é comparado com o catálogo completo, percorrido à parte. Os limites do
    preço estão incluídos: 12.01 e 14.24 são preços de produtos da Toolshop.

    Cenário: Filtrar por categoria inclui os produtos sem o nome da categoria
      O "Bolt Cutters" é da categoria Pliers, mas não tem "pliers" no nome.
      Quando filtro o catálogo pela categoria "Pliers"
      Então recebo exatamente os produtos do catálogo que cumprem o filtro

    Cenário: Filtrar por marca
      Quando filtro o catálogo pela marca "MightyCraft Hardware"
      Então recebo exatamente os produtos do catálogo que cumprem o filtro

    Cenário: Filtrar por preço inclui os produtos com o preço dos limites
      Quando filtro o catálogo por preço entre 12.01 e 14.24
      Então recebo exatamente os produtos do catálogo que cumprem o filtro

    Cenário: Filtros e ordenação juntos
      Quando filtro o catálogo pela categoria "Pliers", pela marca "ForgeFlex Tools" e por preço entre 10.00 e 20.00, com a ordem "preço crescente"
      Então recebo exatamente os produtos do catálogo que cumprem o filtro
      E os produtos vêm ordenados por "preço crescente"

  Regra: Os produtos de aluguer ficam fora do catálogo e consultam-se à parte

    Cenário: O catálogo mostra só produtos de venda
      Quando percorro todas as páginas do catálogo, com a ordem "por omissão"
      Então nenhum produto é de aluguer

    Cenário: Os produtos de aluguer consultam-se à parte
      Quando consulto os produtos de aluguer
      Então todos os produtos recebidos são de aluguer

  Regra: Um pedido ao catálogo com um valor que o Swagger não prevê é recusado
    Um erro de quem pede responde-se com 422, como no resto da API, a dizer o que está
    errado. Nunca com um erro do servidor, nem aceitando o pedido em silêncio.

    Esquema do Cenário: Um pedido ao catálogo com <problema> é recusado
      Quando consulto "<endereço>" com "<parâmetros>"
      Então recebo uma resposta com o código 422

      @bug-conhecido @issue-27
      Exemplos: Erro do servidor
        Bug: um campo de ordenação desconhecido dá erro 500 em vez de ser recusado.
        https://github.com/evangelistaaj/Projeto-toolshop-api/issues/27

        | problema                                  | endereço  | parâmetros   |
        | uma ordenação por um campo que não existe | /products | sort=foo,asc |

      @bug-conhecido @issue-28
      Exemplos: Aceite em silêncio
        Bug: os parâmetros do catálogo não são validados; o pedido é aceite com 200.
        https://github.com/evangelistaaj/Projeto-toolshop-api/issues/28

        | problema                                 | endereço         | parâmetros           |
        | uma ordenação num sentido que não existe | /products        | sort=name,cima       |
        | um preço que não é um número             | /products        | between=price,abc,10 |
        | uma pesquisa sem termo                   | /products/search | q=                   |
