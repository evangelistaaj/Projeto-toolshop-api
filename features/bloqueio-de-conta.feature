# language: pt
@so-local
Funcionalidade: Bloqueio de conta
  Como cliente da Toolshop
  Quero que a minha conta seja bloqueada depois de várias tentativas falhadas
  Para que ninguém consiga adivinhar a minha password

  Cada cenário usa uma conta acabada de registar, nunca as contas partilhadas.

  Contexto:
    Dado que tenho uma conta registada

  Cenário: Três tentativas falhadas bloqueiam a conta
    Quando falho o login 3 vezes
    E faço login com a password certa
    Então a conta está bloqueada

  Cenário: Um login certo antes do bloqueio reinicia as tentativas
    Dado que falhei o login 2 vezes
    E que fiz login com a password certa
    Quando falho o login 2 vezes
    E faço login com a password certa
    Então entro na conta

  Cenário: A resposta a uma password errada não revela que a conta existe
    Quando faço login com uma password errada
    Então a resposta é igual à de um email que não existe
