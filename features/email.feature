# language: pt
@so-local @lento
Funcionalidade: Email de confirmação da compra
  Como cliente da Toolshop
  Quero receber um email com o resumo da minha compra
  Para ter um registo do que comprei e de quanto paguei

  Precisa do servidor de email de testes (mailcatcher) a correr, em
  http://localhost:1080 (ver README). O email é enviado em segundo plano,
  até cerca de um minuto depois da compra.

  Contexto:
    Dado que fiz login com a conta de cliente de demonstração
    E que tenho no carrinho os produtos:
      | quantidade | preço | CO2 |
      | 2          | 10.00 | A   |
      | 1          | 5.00  | D   |
    E que indico a morada sugerida para o código postal "1000-001" de "Portugal"
    E que indico o distrito "Lisboa"

  Cenário: O email de confirmação tem todos os produtos e o total da fatura
    Quando finalizo a compra
    Então recebo um email de confirmação com todos os produtos comprados
    E o total do email é o total da fatura

  @bug-conhecido @issue-11
  Cenário: O email de confirmação mostra o desconto ecológico
    Bug: o modelo do email tem a linha do desconto ecológico, mas quem monta
    o email não lhe passa o valor, por isso a linha nunca aparece.
    https://github.com/evangelistaaj/Projeto-toolshop-api/issues/11

    Quando finalizo a compra
    Então recebo um email de confirmação com todos os produtos comprados
    E o email mostra o desconto ecológico da fatura

  @bug-conhecido @issue-12
  Cenário: O email de confirmação indica o número da fatura
    Bug: o email remete para a fatura na conta do cliente, mas não diz qual.
    https://github.com/evangelistaaj/Projeto-toolshop-api/issues/12

    Quando finalizo a compra
    Então recebo um email de confirmação com todos os produtos comprados
    E o email indica o número da fatura
