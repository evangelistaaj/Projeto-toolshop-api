# language: pt
@so-local
Funcionalidade: Gestão de produtos
  Como administrador da Toolshop
  Quero criar, alterar e apagar produtos
  Para manter o catálogo da loja atualizado

  Cenário: Criar um produto com dados válidos
    Dado que fiz login com a conta de administrador
    Quando crio um produto com os dados:
      | nome  | Martelo de teste |
      | preço |            12.50 |
    Então o produto fica disponível no catálogo com esses dados

  Cenário: Alterar o preço de um produto
    Dado que fiz login com a conta de administrador
    E que existe um produto criado por mim
    Quando altero o preço do produto para 19.99
    Então o produto passa a ter o preço 19.99

  Cenário: Apagar um produto
    Dado que fiz login com a conta de administrador
    E que existe um produto criado por mim
    Quando apago o produto
    Então o produto deixa de existir no catálogo

  Cenário: Consultar um produto que não existe
    Quando consulto um produto que não existe
    Então recebo uma resposta com o código 404

  # Bug: a API aceita criar produtos sem login. Ver issue #1:
  # https://github.com/evangelistaaj/Projeto-toolshop-api/issues/1
  @bug-conhecido
  Cenário: Criar um produto sem login
    Quando crio um produto com os dados:
      | nome  | Martelo de teste |
      | preço |            12.50 |
    Então recebo uma resposta com o código 401
