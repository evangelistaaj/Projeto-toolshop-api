# language: pt
@so-local
Funcionalidade: Registo de cliente
  Como visitante da Toolshop
  Quero criar uma conta
  Para fazer compras e acompanhar as minhas encomendas

  Regra: Um visitante regista-se com dados válidos

    Cenário: Registo com dados válidos
      Quando registo um cliente com dados válidos
      Então o registo é aceite
      E consigo fazer login com a conta registada

  Regra: A idade tem de estar entre 18 e 75 anos
    A idade conta em anos completos: aceita-se a partir do dia em que se faz
    18 anos e até à véspera de se fazer 75 ("Customer must be younger than 75").
    As datas de nascimento são calculadas a partir de hoje.

    Esquema do Cenário: Um visitante que <idade> é aceite
      Quando registo um cliente que <idade>
      Então o registo é aceite

      Exemplos:
        | idade              |
        | fez 18 anos ontem  |
        | faz 75 anos amanhã |

      @bug-conhecido @issue-20
      Exemplos: no dia em que faz 18 anos
        Bug: o limite dos 18 anos é estrito, e quem faz 18 anos hoje é recusado.
        https://github.com/evangelistaaj/Projeto-toolshop-api/issues/20

        | idade            |
        | faz 18 anos hoje |

    Esquema do Cenário: Um visitante que <idade> é recusado
      Quando registo um cliente que <idade>
      Então o registo é recusado por causa do campo "data de nascimento"

      Exemplos:
        | idade              |
        | faz 18 anos amanhã |

      @bug-conhecido @issue-20
      Exemplos: a partir dos 75 anos
        Bug: o limite dos 75 anos é calculado a partir do limite dos 18, por isso
        só recusa a partir dos 93 anos.
        https://github.com/evangelistaaj/Projeto-toolshop-api/issues/20

        | idade            |
        | faz 75 anos hoje |
        | faz 80 anos hoje |

  Regra: Os dados obrigatórios e os formatos são validados
    Cada exemplo parte de dados válidos e muda só um campo.

    Esquema do Cenário: O registo com <caso> é recusado
      Quando registo um cliente com o campo "<campo>" igual a "<valor>"
      Então o registo é recusado por causa do campo "<campo>"

      Exemplos:
        | caso                          | campo    | valor             |
        | uma password sem maiúsculas   | password | toolshop#lisboa42 |
        | uma password sem algarismos   | password | Toolshop#Lisboa   |
        | uma password sem símbolos     | password | Toolshop42Lisboa  |
        | uma password com 7 caracteres | password | Ts#4lxQ           |

      @bug-conhecido @issue-22
      Exemplos: email sem formato
        Bug: o registo não valida o formato do email.
        https://github.com/evangelistaaj/Projeto-toolshop-api/issues/22

        | caso                            | campo | valor          |
        | um email sem o formato de email | email | joana.ferreira |

      @bug-conhecido @issue-23
      Exemplos: código postal
        Bug: a versão publicada não valida o formato do código postal (já
        corrigido no código-fonte da Toolshop).
        https://github.com/evangelistaaj/Projeto-toolshop-api/issues/23

        | caso                                | campo         | valor   |
        | um código postal português inválido | código postal | 1000-01 |

    @bug-conhecido @issue-21
    Cenário: O registo sem data de nascimento é recusado
      Bug: a data de nascimento não é obrigatória, e a idade nunca é verificada.
      https://github.com/evangelistaaj/Projeto-toolshop-api/issues/21

      Quando registo um cliente sem data de nascimento
      Então o registo é recusado por causa do campo "data de nascimento"

    Cenário: O registo com um email que já tem conta é recusado
      Dado que tenho uma conta registada
      Quando registo outro cliente com o mesmo email
      Então o registo é recusado por já existir uma conta com esse email

  Regra: O registo não dá privilégios de administrador

    Cenário: Um visitante que pede o perfil de administrador fica cliente
      Quando registo um cliente que pede o perfil de administrador
      Então o registo é aceite
      E a conta registada tem o perfil de cliente
