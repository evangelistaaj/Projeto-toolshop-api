# language: pt
@so-local
Funcionalidade: Autorização
  Como cliente da Toolshop
  Quero que os meus dados e as funções da loja estejam protegidos
  Para que ninguém veja ou altere o que não lhe pertence

  Uma recusa pode vir como 401, 403 ou 404 (esconder que o recurso existe também
  é uma boa prática). Além do código, confirma-se sempre que nada mudou.

  Regra: Um cliente não acede às faturas de outro cliente

    Contexto:
      Dado que outro cliente fez uma compra
      E que fiz login como cliente

    Cenário: Um cliente não consegue ver a fatura de outro cliente
      Quando consulto a fatura do outro cliente
      Então a fatura não me é mostrada

    @bug-conhecido @issue-18
    Cenário: Um cliente não consegue mudar o estado da fatura de outro cliente
      Bug: a mudança de estado não verifica de quem é a fatura nem se quem
      pede é administrador.
      https://github.com/evangelistaaj/Projeto-toolshop-api/issues/18

      Quando marco a fatura do outro cliente como concluída
      Então a alteração é recusada
      E a fatura do outro cliente não fica concluída

    @bug-conhecido @issue-19
    Cenário: Um cliente não consegue descarregar o PDF da fatura de outro cliente
      Bug: o PDF é procurado só pelo número da fatura, sem verificar o dono;
      e os números são sequenciais.
      https://github.com/evangelistaaj/Projeto-toolshop-api/issues/19

      Dado que o PDF da fatura do outro cliente já foi gerado
      Quando descarrego o PDF da fatura do outro cliente
      Então o PDF não me é entregue

  Regra: Só o administrador gere os produtos e o estado das faturas

    # A API tem duas formas de alterar um produto: PUT (envia o produto inteiro)
    # e PATCH (envia só os campos que mudam). As duas têm de exigir o administrador.
    @bug-conhecido @issue-17
    Esquema do Cenário: Alterar o preço de um produto sem login é recusado (pedido <pedido>)
      Bug: a alteração de produtos não exige login nem perfil de administrador.
      https://github.com/evangelistaaj/Projeto-toolshop-api/issues/17

      Dado que existe um produto na loja
      Quando altero o preço do produto para 1.00 com um pedido <pedido>
      Então a alteração é recusada
      E o produto mantém o preço

      Exemplos:
        | pedido |
        | PUT    |
        | PATCH  |

    @bug-conhecido @issue-17
    Esquema do Cenário: Um cliente não consegue alterar o preço de um produto (pedido <pedido>)
      Bug: a alteração de produtos não exige perfil de administrador.
      https://github.com/evangelistaaj/Projeto-toolshop-api/issues/17

      Dado que existe um produto na loja
      E que fiz login como cliente
      Quando altero o preço do produto para 1.00 com um pedido <pedido>
      Então a alteração é recusada
      E o produto mantém o preço

      Exemplos:
        | pedido |
        | PUT    |
        | PATCH  |

    Cenário: Um cliente não consegue apagar um produto
      Dado que existe um produto na loja
      E que fiz login como cliente
      Quando apago o produto
      Então a alteração é recusada
      E o produto continua no catálogo

    @bug-conhecido @issue-18
    Cenário: Um cliente não consegue mudar o estado da sua própria fatura
      Bug: a mudança de estado não exige perfil de administrador.
      https://github.com/evangelistaaj/Projeto-toolshop-api/issues/18

      Dado que fiz login como cliente
      E que fiz uma compra
      Quando marco a minha fatura como concluída
      Então a alteração é recusada
      E a minha fatura não fica concluída

  Regra: Um cliente não acede aos dados de outros clientes
    Os dados de uma conta (nome, email, telefone, data de nascimento e morada) são
    pessoais. A lista de clientes já é só para o administrador; nenhum outro caminho
    os pode mostrar a um cliente.

    Contexto:
      Dado que outro cliente tem conta na loja
      E que fiz login como cliente

    Cenário: Um cliente não consegue ver os dados de outro cliente
      Quando consulto os dados do outro cliente
      Então os dados do outro cliente não me são mostrados

    @bug-conhecido @issue-29
    Cenário: Um cliente não encontra outros clientes na pesquisa de utilizadores
      Bug: a pesquisa de utilizadores mostra a um cliente os dados pessoais dos outros.
      https://github.com/evangelistaaj/Projeto-toolshop-api/issues/29

      Quando pesquiso clientes pelo apelido do outro cliente
      Então os dados do outro cliente não me são mostrados

    Esquema do Cenário: Um cliente não consegue alterar os dados de outro cliente (pedido <pedido>)
      Quando altero o nome do outro cliente com um pedido <pedido>
      Então a alteração é recusada
      E os dados do outro cliente ficam como estavam

      Exemplos:
        | pedido |
        | PUT    |
        | PATCH  |

    Cenário: Um cliente não consegue apagar a conta de outro cliente
      Quando apago a conta do outro cliente
      Então a alteração é recusada
      E a conta do outro cliente continua a existir

  Regra: Um cliente não se torna administrador
    O perfil de uma conta só muda pela mão do administrador. O registo já ignora um
    pedido de perfil de administrador; a alteração da própria conta também.

    Cenário: Pedir o perfil de administrador numa alteração à própria conta não muda o perfil
      Dado que tenho uma conta registada
      Quando peço o perfil de administrador numa alteração à minha conta
      Então a conta registada tem o perfil de cliente
