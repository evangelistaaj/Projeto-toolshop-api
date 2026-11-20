# language: pt
@so-local
Funcionalidade: Password da conta
  Como cliente da Toolshop
  Quero mudar a minha password e recuperá-la se a esquecer
  Para manter a minha conta segura

  Todos os cenários usam uma conta criada no próprio cenário e apagada no fim.

  Regra: A password muda só com a password atual e uma password nova válida

    Contexto:
      Dado que tenho uma conta registada
      E que fiz login com a conta registada

    Cenário: Mudar a password com dados válidos
      Quando altero a minha password
      Então entro com a password nova e não com a antiga

    Esquema do Cenário: Mudar a password com <problema> é recusado
      Quando altero a minha password com <problema>
      Então a alteração da password é recusada
      E a password da conta não muda

      Exemplos:
        | problema                  |
        | a password atual errada   |
        | uma confirmação diferente |
        | uma password fraca        |

    @bug-conhecido @issue-33
    Cenário: Depois de mudar a password, a sessão anterior deixa de ser aceite
      Bug: o token de antes da alteração continua válido.
      https://github.com/evangelistaaj/Projeto-toolshop-api/issues/33

      Quando altero a minha password
      Então a sessão de antes da alteração deixa de ser aceite

  Regra: Pedir uma nova password não muda a password nem revela quem tem conta

    Contexto:
      Dado que tenho uma conta registada

    @bug-conhecido @issue-31
    Cenário: Pedir uma nova password não muda a password da conta
      Bug: o pedido, sem login, muda a password de qualquer conta para um valor fixo e conhecido.
      https://github.com/evangelistaaj/Projeto-toolshop-api/issues/31

      Quando peço uma nova password para a conta registada
      Então a password da conta continua a mesma

    @bug-conhecido @issue-32
    Cenário: A resposta ao pedido de nova password é igual para um email com conta e sem conta
      Bug: um email sem conta recebe 422; um email com conta recebe 200.
      https://github.com/evangelistaaj/Projeto-toolshop-api/issues/32

      Quando peço uma nova password para um email com conta e para um email sem conta
      Então as duas respostas são iguais
