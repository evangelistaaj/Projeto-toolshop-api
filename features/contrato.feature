# language: pt
Funcionalidade: Contrato das respostas
  Como quem integra com a API da Toolshop
  Quero que as respostas tenham a forma documentada no Swagger
  Para poder escrever um cliente a confiar na documentação

  O contrato de cada resposta é o Swagger da Toolshop (components.schemas), em
  contratos/*.schema.json: cada campo documentado tem de vir, com o tipo documentado,
  e null só onde o Swagger o permite. Campos a mais são permitidos (acrescentar um
  campo não parte um cliente). O Swagger não marca nenhum campo como obrigatório;
  aqui, todos os campos documentados são tratados como prometidos.

  Cenário: O token do login segue o contrato
    Quando faço login como cliente
    Então a resposta segue o contrato "token"

  @bug-conhecido @issue-24
  Cenário: A lista de produtos segue o contrato
    Desvio do Swagger: a marca e a categoria de cada produto vêm reduzidas.
    https://github.com/evangelistaaj/Projeto-toolshop-api/issues/24

    Quando consulto o catálogo de produtos
    Então a resposta segue o contrato "página de produtos"

  @bug-conhecido @issue-24
  Cenário: Um produto segue o contrato
    Desvio do Swagger: a marca e a categoria do produto vêm reduzidas.
    https://github.com/evangelistaaj/Projeto-toolshop-api/issues/24

    Quando consulto um produto do catálogo
    Então a resposta segue o contrato "produto"

  @bug-conhecido @issue-25
  Cenário: Os dados da conta seguem o contrato
    Desvio do Swagger: faltam os campos enabled e failed_login_attempts.
    https://github.com/evangelistaaj/Projeto-toolshop-api/issues/25

    Dado que fiz login como cliente
    Quando consulto os dados da minha conta
    Então a resposta segue o contrato "conta"

  @so-local @bug-conhecido @issue-26
  Cenário: Uma fatura segue o contrato
    Desvio do Swagger: null em campos numéricos e produto reduzido em cada linha.
    https://github.com/evangelistaaj/Projeto-toolshop-api/issues/26

    Dado que fiz login como cliente
    E que fiz uma compra
    Quando consulto a minha fatura
    Então a resposta segue o contrato "fatura"
