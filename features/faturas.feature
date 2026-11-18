# language: pt
@so-local
Funcionalidade: Compra com fatura
  Como cliente da Toolshop
  Quero finalizar a compra do meu carrinho
  Para receber os produtos e a respetiva fatura

  Cada cenário compra um produto criado só para ele, com stock conhecido,
  para não depender nem gastar o stock dos dados iniciais.
  Em Portugal, a pesquisa de morada devolve o distrito vazio (issue #2),
  por isso o cliente tem de o indicar.

  Contexto:
    Dado que fiz login com a conta de cliente de demonstração

  Cenário: Comprar com a morada sugerida pelo código postal
    Dado que tenho no carrinho a quantidade 2 de um produto com stock 5
    E que indico a morada sugerida para o código postal "1000-001" de "Portugal"
    E que indico o distrito "Lisboa"
    Quando finalizo a compra
    Então a fatura é criada com os produtos do carrinho

  Regra: A cidade tem de corresponder ao código postal

    Contexto:
      Dado que tenho no carrinho a quantidade 1 de um produto com stock 5
      E que indico a morada sugerida para o código postal "1000-001" de "Portugal"
      E que troco a cidade por "Lisboa"
      E que indico o distrito "Lisboa"

    Cenário: A compra com uma cidade que não corresponde ao código postal é recusada
      Quando finalizo a compra
      Então a compra é recusada

    @bug-conhecido @issue-5
    Cenário: O erro de uma cidade que não corresponde ao código postal aponta para a cidade
      Bug: o erro aponta para o país (billing_country).
      https://github.com/evangelistaaj/Projeto-toolshop-api/issues/5

      Quando finalizo a compra
      Então o erro da compra aponta para a cidade

    @bug-conhecido @issue-5
    Cenário: A mensagem de erro explica que a cidade não corresponde ao código postal
      Bug: a mensagem diz que a cidade não pertence ao país.
      https://github.com/evangelistaaj/Projeto-toolshop-api/issues/5

      Quando finalizo a compra
      Então a mensagem de erro da compra refere o código postal

    @bug-conhecido @issue-6
    Cenário: O erro de uma cidade que não corresponde ao código postal segue o formato da API
      Bug: os erros das faturas não seguem o formato do resto da API.
      https://github.com/evangelistaaj/Projeto-toolshop-api/issues/6

      Quando finalizo a compra
      Então o erro da compra segue o formato de erros da API

  Regra: O distrito é obrigatório

    Contexto:
      Dado que tenho no carrinho a quantidade 1 de um produto com stock 5
      E que indico a morada sugerida para o código postal "1000-001" de "Portugal"
      E que deixo o distrito em branco

    Cenário: A compra sem distrito é recusada
      Quando finalizo a compra
      Então a compra é recusada

    @bug-conhecido @issue-7
    Cenário: A mensagem de erro diz que o distrito é obrigatório
      Bug: a mensagem diz "must be a string" em vez de dizer que o distrito
      é obrigatório.
      https://github.com/evangelistaaj/Projeto-toolshop-api/issues/7

      Quando finalizo a compra
      Então a mensagem de erro da compra diz que o distrito é obrigatório

    @bug-conhecido @issue-6
    Cenário: O erro da compra sem distrito segue o formato da API
      Bug: os erros das faturas não seguem o formato do resto da API.
      https://github.com/evangelistaaj/Projeto-toolshop-api/issues/6

      Quando finalizo a compra
      Então o erro da compra segue o formato de erros da API

  Regra: O número da fatura segue a numeração da loja

    Cenário: O número da fatura começa pelo ano atual
      Dado que tenho no carrinho a quantidade 1 de um produto com stock 5
      E que indico a morada sugerida para o código postal "1000-001" de "Portugal"
      E que indico o distrito "Lisboa"
      Quando finalizo a compra
      Então o número da fatura começa pelo ano atual

    Cenário: Duas compras seguidas têm números de fatura consecutivos
      Quando faço duas compras seguidas
      Então os números das duas faturas são consecutivos

    @bug-conhecido @issue-8
    Cenário: O número da fatura tem o formato das faturas da loja
      Bug: as faturas novas têm 6 algarismos de sequência; as da loja têm 7.
      https://github.com/evangelistaaj/Projeto-toolshop-api/issues/8

      Dado que tenho no carrinho a quantidade 1 de um produto com stock 5
      E que indico a morada sugerida para o código postal "1000-001" de "Portugal"
      E que indico o distrito "Lisboa"
      Quando finalizo a compra
      Então o número da fatura tem o formato INV-ano-sequência de 7 algarismos

  Regra: A compra gasta o stock dos produtos
    O stock é descontado em segundo plano, por um agendador que corre uma vez
    por minuto. Os cenários lentos esperam até 90 segundos pelo resultado.

    @lento
    Cenário: Comprar todo o stock esgota o produto
      Dado que tenho no carrinho a quantidade 3 de um produto com stock 3
      E que indico a morada sugerida para o código postal "1000-001" de "Portugal"
      E que indico o distrito "Lisboa"
      Quando finalizo a compra
      Então o produto fica esgotado

    @lento @bug-conhecido @issue-10
    Cenário: O catálogo mostra o produto esgotado quando o stock acaba
      Bug: o catálogo guarda o produto em cache durante 5 minutos, e a cache
      não é atualizada quando o stock acaba.
      https://github.com/evangelistaaj/Projeto-toolshop-api/issues/10

      Dado que tenho no carrinho a quantidade 3 de um produto com stock 3
      E que indico a morada sugerida para o código postal "1000-001" de "Portugal"
      E que indico o distrito "Lisboa"
      Quando finalizo a compra
      Então o produto fica esgotado
      E o catálogo mostra o produto esgotado

    @bug-conhecido @issue-9
    Cenário: Comprar mais unidades do que o stock disponível é recusado
      Bug: a API não verifica o stock.
      https://github.com/evangelistaaj/Projeto-toolshop-api/issues/9

      Dado que tenho no carrinho a quantidade 3 de um produto com stock 2
      E que indico a morada sugerida para o código postal "1000-001" de "Portugal"
      E que indico o distrito "Lisboa"
      Quando finalizo a compra
      Então a compra é recusada

    @bug-conhecido @issue-9
    Cenário: Juntar ao carrinho um produto esgotado é recusado
      Bug: a API não verifica o stock.
      https://github.com/evangelistaaj/Projeto-toolshop-api/issues/9

      Dado que existe um produto com stock 0
      Quando junto esse produto a um carrinho novo
      Então o produto não é aceite no carrinho
