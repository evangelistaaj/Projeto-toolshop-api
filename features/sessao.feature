# language: pt
@so-local
Funcionalidade: Sessão
  Como cliente da Toolshop
  Quero que a minha sessão se renove em segurança e possa proteger a conta com dois passos
  Para continuar a comprar sem que outra pessoa use a minha conta

  Todos os cenários usam uma conta criada no próprio cenário e apagada no fim.

  Contexto:
    Dado que tenho uma conta registada
    E que fiz login com a conta registada

  Regra: Renovar o token dá um token novo e invalida o anterior

    Cenário: Renovar o token
      Quando renovo o meu token
      Então recebo um token novo e o antigo deixa de ser aceite

    Cenário: Depois de terminar a sessão, o token não se renova
      Dado que terminei a sessão
      Quando renovo o meu token
      Então a renovação é recusada

    @bug-conhecido @issue-35
    Cenário: Renovar sem token é recusado
      Bug: o pedido sem token dá um erro do servidor (500) em vez de 401.
      https://github.com/evangelistaaj/Projeto-toolshop-api/issues/35

      Quando renovo o token sem enviar nenhum
      Então a renovação é recusada

    @bug-conhecido @issue-33
    Cenário: Depois de mudar a password, a sessão anterior não se renova
      Bug: o token de antes da alteração continua válido e pode ser renovado.
      https://github.com/evangelistaaj/Projeto-toolshop-api/issues/33

      Quando altero a minha password
      Então a sessão de antes da alteração não pode ser renovada

  Regra: Com a verificação em dois passos, entrar exige o código da app de autenticação

    Cenário: Ativar a verificação em dois passos com um código errado é recusado
      Quando ativo a verificação em dois passos com um código errado
      Então recebo uma resposta com o código 400

    Cenário: Com a verificação ativa, a password sozinha não dá acesso à conta
      Dado que ativei a verificação em dois passos
      Quando faço login com a conta registada
      Então o login pede o código de dois passos e ainda não dá acesso à conta

    @bug-conhecido @issue-36
    Cenário: Com a verificação ativa, a password e o código dão acesso à conta
      Bug: o login em dois passos recusa o próprio token restrito; a conta fica sem forma de entrar.
      https://github.com/evangelistaaj/Projeto-toolshop-api/issues/36

      Dado que ativei a verificação em dois passos
      Quando completo o login com o código de dois passos
      Então entro na minha conta
