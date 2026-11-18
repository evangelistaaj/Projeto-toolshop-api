# language: pt
@so-local
Funcionalidade: Desconto ecológico
  Como cliente da Toolshop
  Quero ter desconto quando compro sobretudo produtos amigos do ambiente
  Para ser recompensado por escolhas mais sustentáveis

  A regra vem do código-fonte da Toolshop (InvoiceService), porque não está
  documentada: um produto é ecológico se a classificação CO2 for A ou B, e a
  fatura tem 5% de desconto se mais de metade das unidades compradas forem
  de produtos ecológicos.

  Contexto:
    Dado que fiz login com a conta de cliente de demonstração
    E que indico a morada sugerida para o código postal "1000-001" de "Portugal"
    E que indico o distrito "Lisboa"

  Regra: Há 5% de desconto quando mais de metade das unidades são ecológicas

    Cenário: Só produtos ecológicos têm desconto
      Dado que tenho no carrinho os produtos:
        | quantidade | preço | CO2 |
        | 2          | 10.00 | A   |
        | 1          | 5.00  | B   |
      Quando finalizo a compra
      Então a fatura tem um desconto ecológico de 5%

    Cenário: Sem produtos ecológicos não há desconto
      Dado que tenho no carrinho os produtos:
        | quantidade | preço | CO2 |
        | 2          | 10.00 | D   |
        | 1          | 5.00  | E   |
      Quando finalizo a compra
      Então a fatura não tem desconto ecológico

    Cenário: Com a maioria das unidades ecológicas há desconto
      Dado que tenho no carrinho os produtos:
        | quantidade | preço | CO2 |
        | 2          | 10.00 | A   |
        | 1          | 5.00  | D   |
      Quando finalizo a compra
      Então a fatura tem um desconto ecológico de 5%

    Cenário: Com exatamente metade das unidades ecológicas não há desconto
      Dado que tenho no carrinho os produtos:
        | quantidade | preço | CO2 |
        | 1          | 10.00 | A   |
        | 1          | 10.00 | D   |
      Quando finalizo a compra
      Então a fatura não tem desconto ecológico

    Cenário: O desconto conta unidades, não produtos
      Dado que tenho no carrinho os produtos:
        | quantidade | preço | CO2 |
        | 3          | 10.00 | A   |
        | 1          | 5.00  | D   |
        | 1          | 5.00  | E   |
      Quando finalizo a compra
      Então a fatura tem um desconto ecológico de 5%

    Cenário: A classificação B conta como ecológica
      Dado que tenho no carrinho os produtos:
        | quantidade | preço | CO2 |
        | 2          | 10.00 | B   |
        | 1          | 5.00  | D   |
      Quando finalizo a compra
      Então a fatura tem um desconto ecológico de 5%

    Cenário: A classificação C não conta como ecológica
      Dado que tenho no carrinho os produtos:
        | quantidade | preço | CO2 |
        | 2          | 10.00 | C   |
        | 1          | 5.00  | A   |
      Quando finalizo a compra
      Então a fatura não tem desconto ecológico

  Regra: Os valores da fatura batem certo ao cêntimo
    Os valores de dinheiro guardam-se com 2 casas decimais. O desconto de 5%
    pode dar mais casas (29.97 × 5% = 1.4985), e a fatura tem de continuar
    coerente: a resposta da compra igual à fatura guardada, e o total igual
    ao subtotal menos o desconto, sem diferenças de arredondamento.

    @bug-conhecido @issue-13
    Cenário: A fatura devolvida na compra é igual à fatura guardada
      Bug: a compra devolve o desconto e o total sem arredondar (1.4985 e
      28.4715), e a fatura guardada tem 1.50 e 28.47.
      https://github.com/evangelistaaj/Projeto-toolshop-api/issues/13

      Dado que tenho no carrinho os produtos:
        | quantidade | preço | CO2 |
        | 3          | 9.99  | A   |
      Quando finalizo a compra
      Então a fatura devolvida na compra tem os mesmos valores da fatura guardada

    @bug-conhecido @issue-13
    Cenário: O total é o subtotal menos o desconto, ao cêntimo
      Bug: o desconto e o total são arredondados cada um à sua conta; com
      10.10 os dois sobem (0.51 e 9.60) e 10.10 − 0.51 ≠ 9.60.
      https://github.com/evangelistaaj/Projeto-toolshop-api/issues/13

      Dado que tenho no carrinho os produtos:
        | quantidade | preço | CO2 |
        | 1          | 10.10 | A   |
      Quando finalizo a compra
      Então o total da fatura é o subtotal menos os descontos, ao cêntimo
