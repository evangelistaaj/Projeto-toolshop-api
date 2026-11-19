# language: pt
Funcionalidade: Autenticação
  Como cliente da Toolshop
  Quero entrar na minha conta
  Para aceder aos meus dados e às minhas compras

  Cenário: Login com sucesso com a conta de cliente
    Quando faço login como cliente
    Então recebo um token de acesso válido

  Cenário: Login com um email que não existe
    Quando faço login com o email "nao.existe@exemplo.pt" e a password "qualquer"
    Então recebo uma resposta com o código 401

  Cenário: Consultar os dados da conta depois do login
    Dado que fiz login como cliente
    Quando consulto os dados da minha conta
    Então vejo os dados da conta com que fiz login

  Cenário: Consultar os dados da conta sem login
    Quando consulto os dados da minha conta
    Então recebo uma resposta com o código 401

  Regra: Só um token válido, emitido pela Toolshop, dá acesso
    O token de acesso é um JWT: qualquer pessoa consegue ler o conteúdo, mas só a
    Toolshop o consegue assinar. Um token que não é um JWT, que foi alterado, que
    não tem assinatura, que já expirou ou de uma sessão terminada tem de ser
    recusado.

    Cenário: Um token que não é um JWT é recusado
      Dado que tenho o token "isto-nao-e-um-token"
      Quando consulto os dados da minha conta
      Então recebo uma resposta com o código 401

    Cenário: Um token alterado para o perfil de administrador é recusado
      Dado que fiz login como cliente
      E que alterei o meu token para ter o perfil de administrador
      Quando consulto a lista de clientes
      Então recebo uma resposta com o código 401

    Cenário: Um token sem assinatura é recusado
      Dado que fiz login como cliente
      E que retirei a assinatura do meu token
      Quando consulto os dados da minha conta
      Então recebo uma resposta com o código 401

    Cenário: Depois de terminar a sessão, o token deixa de servir
      Dado que fiz login como cliente
      E que terminei a sessão
      Quando consulto os dados da minha conta
      Então recebo uma resposta com o código 401

    @so-local
    Esquema do Cenário: Um token que <situacao> <resultado>
      Para não esperar os 5 minutos de validade, o token é assinado com o segredo
      da Toolshop local, com outras datas. O token ainda válido é o controlo: prova
      que a recusa do expirado vem da data, e não da assinatura.

      Dado que tenho um token da minha conta que <situacao>
      Quando consulto os dados da minha conta
      Então recebo uma resposta com o código <codigo>

      Exemplos:
        | situacao                 | resultado  | codigo |
        | expirou há 1 minuto      | é recusado | 401    |
        | expira daqui a 5 minutos | é aceite   | 200    |
