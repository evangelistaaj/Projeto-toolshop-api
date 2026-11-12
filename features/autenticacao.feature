# language: pt
Funcionalidade: Autenticação
  Como cliente da Toolshop
  Quero entrar na minha conta
  Para aceder aos meus dados e às minhas compras

  Cenário: Login com sucesso com a conta de cliente
    Quando faço login com a conta de cliente de demonstração
    Então recebo um token de acesso válido

  Cenário: Login com um email que não existe
    Quando faço login com o email "nao.existe@exemplo.pt" e a password "qualquer"
    Então recebo uma resposta com o código 401

  Cenário: Consultar os dados da conta depois do login
    Dado que fiz login com a conta de cliente de demonstração
    Quando consulto os dados da minha conta
    Então vejo os dados da conta com que fiz login

  Cenário: Consultar os dados da conta sem login
    Quando consulto os dados da minha conta
    Então recebo uma resposta com o código 401