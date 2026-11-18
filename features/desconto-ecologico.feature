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
