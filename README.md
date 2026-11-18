# 🧰 Projeto Toolshop API

Testes automatizados da API da **Toolshop** ([Practice Software Testing](https://practicesoftwaretesting.com)), escritos em **Gherkin em português** e executados com **Cucumber + Playwright + TypeScript**.

![Estado](https://img.shields.io/badge/estado-em%20constru%C3%A7%C3%A3o-yellow)
![Node](https://img.shields.io/badge/node-26-339933?logo=nodedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-7-3178C6?logo=typescript&logoColor=white)
![Cucumber](https://img.shields.io/badge/cucumber-13-23D96C?logo=cucumber&logoColor=white)
![Playwright](https://img.shields.io/badge/playwright-1.65-2EAD33?logo=playwright&logoColor=white)

> 🚧 **Projeto em construção.** Este README acompanha o estado real do repositório: só descreve o que já está feito.

---

## 📌 Sobre o projeto

Este repositório é a segunda parte do meu portfolio de automação de testes:

| Projeto | O que testa | Stack |
|---|---|---|
| [Projeto-toolshop](https://github.com/evangelistaaj/Projeto-toolshop) | Interface (E2E) | Playwright + playwright-bdd |
| **Projeto-toolshop-api** (este) | API REST | Playwright (`APIRequestContext`) + Cucumber |

O objetivo é testar a API diretamente, sem browser, usando o Cucumber com World e hooks.

---

## 🛠️ Tecnologias

| Ferramenta | Versão | Para que serve |
|---|---|---|
| [Node.js](https://nodejs.org) | 26 | Ambiente de execução |
| [@cucumber/cucumber](https://github.com/cucumber/cucumber-js) | 13.3 | Lê os `.feature` e executa os passos |
| [@playwright/test](https://playwright.dev) | 1.65 | Cliente HTTP (`request`) e asserções (`expect`) |
| [TypeScript](https://www.typescriptlang.org) | 7.0 | Linguagem dos passos e do código de suporte |
| [tsx](https://tsx.is) | 4.23 | Executa TypeScript sem passo de compilação |

---

## 🚀 Como executar

**Pré-requisitos:**

- Node.js 26 ou superior e Git;
- a Toolshop a correr localmente com Docker ([instruções no repositório original](https://github.com/testsmith-io/practice-software-testing)), com a API em `http://localhost:8091`.

```bash
git clone https://github.com/evangelistaaj/Projeto-toolshop-api.git
cd Projeto-toolshop-api
npm install
npm test
```

> ℹ️ Não é preciso instalar browsers: os testes de API não abrem nenhum.

Por omissão, os testes usam a API em `http://localhost:8091`. Para apontar para outro endereço, define a variável de ambiente `API_URL` antes de correr (PowerShell):

```powershell
$env:API_URL = "http://localhost:8091"
npm test
```

### ⏯️ Comandos

| Comando | O que corre |
|---|---|
| `npm test` | Todos os cenários, exceto os que reproduzem bugs conhecidos e os lentos (alguns segundos) |
| `npm run test:lento` | Só os cenários lentos (`@lento`): esperam por processos em segundo plano, até 90 s cada |
| `npm run test:bugs` | Só os cenários que reproduzem bugs conhecidos (`@bug-conhecido`) |
| `npm run test:limpo` | Repõe os dados da Toolshop local e corre `npm test` |
| `npx cucumber-js --tags @issue-5` | Só os cenários de um bug (cada um tem a tag do seu issue) |

### 📧 Servidor de email de testes

Os cenários do email de confirmação (`features/email.feature`) leem os emails num servidor de email de testes, o [MailCatcher](https://mailcatcher.me), que recebe os emails da Toolshop sem os enviar a ninguém. O `docker-compose.prod.yml` da Toolshop não o inclui, por isso arranca-se à parte, na mesma rede Docker e com o nome que a API espera (`mailcatcher`):

```powershell
docker run -d --name pst-mailcatcher --restart unless-stopped --network pst_default --network-alias mailcatcher -p 1025:1025 -p 1080:1080 dockage/mailcatcher:0.9.0
```

Os emails recebidos podem ser vistos no browser em `http://localhost:1080`. Os testes leem-nos pela API do MailCatcher, nesse mesmo endereço; para usar outro, define a variável `MAIL_URL`.

> ℹ️ Sem o MailCatcher, os emails não são enviados e os trabalhos `SendCheckoutEmail` acabam na tabela de trabalhos falhados (é uma questão do ambiente, não da aplicação). Depois de o arrancar, `docker exec pst-laravel-api-1 php artisan queue:retry all` volta a enviá-los.

### 🧹 Repor os dados

Cada teste cria e apaga os seus próprios dados, por isso os testes passam com ou sem reposição. Algumas coisas não podem ser apagadas pela API (por exemplo, faturas), e para as remover há dois comandos:

| Comando | O que faz |
|---|---|
| `npm run db:reset` | Repõe a base de dados da Toolshop local com os dados iniciais |
| `npm run test:limpo` | Repõe os dados e corre todos os testes |

> ⚠️ A reposição apaga **tudo** o que foi criado na Toolshop local, incluindo dados criados à mão na interface.

### 🔑 Contas de teste

Os testes usam a conta de cliente de demonstração criada pelos dados iniciais da Toolshop (`customer2@practicesoftwaretesting.com`). São credenciais públicas de uma aplicação de treino, definidas em `support/contas.ts`, e podem ser trocadas sem mexer no código:

| Variável | Para que serve |
|---|---|
| `CLIENTE_EMAIL` | Email da conta de cliente |
| `CLIENTE_PASSWORD` | Password da conta de cliente |

> 🔒 Tokens e passwords nunca aparecem nas mensagens de falha: são substituídos por `***` antes de serem mostrados (`support/seguranca.ts`).

---

## 📂 Estrutura

```
features/    Cenários em Gherkin (português)
steps/       Definições dos passos, um ficheiro por funcionalidade
support/     World (estado de cada cenário), hooks (preparação e limpeza),
             contas de teste e proteção de dados sensíveis
             (incluindo o carrinho com vários produtos e a consulta da fatura)
cucumber.js  Configuração do Cucumber
.vscode/     Configuração da extensão Cucumber do VS Code (navegação e autocompletar dos passos)
```

---

## 📝 Exemplo de cenário

```gherkin
# language: pt
Funcionalidade: Catálogo de produtos
  Como cliente da Toolshop
  Quero consultar o catálogo de produtos
  Para escolher as ferramentas de que preciso

  Cenário: Consultar o catálogo
    Quando consulto o catálogo de produtos
    Então recebo uma lista de produtos
```

---

## 📊 Estado atual

| Execuções de cenários | A passar ✅ | A reproduzir um bug 🐞 | Pendentes | Bugs distintos (issues) |
|---|---|---|---|---|
| 53 | 33 | 20 | 0 | 13 |

> Um esquema de cenário conta uma execução por exemplo, e um bug pode ser reproduzido por várias execuções: as 20 execuções a vermelho correspondem a **13 bugs** — #1 (1 execução), #2 (3: Portugal, França e Reino Unido), #3 (2: país inexistente e formato inválido), #4 (1), #5 (2: campo e mensagem do erro), #6 (2: formato do erro da cidade e do distrito), #7 (1), #8 (1), #9 (2: compra acima do stock e produto esgotado no carrinho) #10 (1), #11 (1), #12 (1) e #13 (2: resposta da compra diferente da fatura guardada e contas que falham por 1 cêntimo).

**O que já é verificado**

| Funcionalidade | Cenário | Verificações |
|---|---|---|
| Catálogo de produtos | Consultar o catálogo | Código HTTP 200, lista de produtos não vazia, tipos dos campos `id`, `name`, `price` e `in_stock` |
| Autenticação | Login com sucesso | Código 200, `access_token` em texto, `token_type` "bearer" (sem distinguir maiúsculas), `expires_in` numérico e positivo |
| Autenticação | Login com um email que não existe | Código 401 |
| Autenticação | Consultar os dados da conta depois do login | Código 200, campos da conta, **a password nunca é devolvida**, o email é o da conta com que se fez login |
| Autenticação | Consultar os dados da conta sem login | Código 401 |
| Gestão de produtos | Criar um produto com dados válidos | Código 201; o produto é consultado à parte e tem o nome e o preço enviados |
| Gestão de produtos | Alterar o preço de um produto | Código 200; a consulta seguinte mostra o preço novo |
| Gestão de produtos | Apagar um produto | Código 204; a consulta seguinte devolve 404 |
| Gestão de produtos | Consultar um produto que não existe | Código 404 |
| Gestão de produtos 🐞 | Criar um produto sem login | Código 401 — **falha: a API aceita** (bug [#1](https://github.com/evangelistaaj/Projeto-toolshop-api/issues/1)) |
| Carrinho | Juntar um produto com a quantidade 1 e 10 (partição válida) | Código 200; o carrinho tem o produto numa só linha, com a quantidade pedida |
| Carrinho | Juntar um produto com a quantidade 0 e -1 (partição inválida) | Código 422 |
| Carrinho | Alterar a quantidade de um produto | Código 200; o carrinho mostra a quantidade nova |
| Carrinho | Remover um produto | Código 204; o carrinho fica vazio |
| Carrinho | Juntar um produto que não existe | Código 422 |
| Pesquisa de morada | Morada completa na Alemanha, em Espanha e no Brasil | Código 200; rua, cidade e distrito preenchidos; país e código postal iguais aos pesquisados |
| Pesquisa de morada 🐞 | Morada completa em Portugal, em França e no Reino Unido | O mesmo oráculo — **falha: distrito vazio** (bug [#2](https://github.com/evangelistaaj/Projeto-toolshop-api/issues/2)) |
| Pesquisa de morada 🐞 | País que não existe (código `XX`, reservado pela norma ISO 3166) | Código 422 — **falha: devolve 200 com uma morada americana** (bug [#3](https://github.com/evangelistaaj/Projeto-toolshop-api/issues/3)) |
| Pesquisa de morada 🐞 | Código postal português com formato inválido (`1000`) | Código 422 — **falha: devolve 200** (bug [#3](https://github.com/evangelistaaj/Projeto-toolshop-api/issues/3)) |
| Pesquisa de morada 🐞 | Argentina | O distrito é uma das 24 províncias argentinas (sem distinguir acentos nem maiúsculas) — **falha: devolve "Illinois"** (bug [#4](https://github.com/evangelistaaj/Projeto-toolshop-api/issues/4)) |
| Faturas | Comprar com a morada sugerida pelo código postal | Código 201; número `INV-…`; a fatura, consultada à parte, tem a morada enviada e uma linha com o produto, a quantidade, o preço unitário e o subtotal certos |
| Faturas | Cidade que não corresponde ao código postal: a compra é recusada | Código 422; nenhuma fatura criada |
| Faturas 🐞 | Cidade que não corresponde ao código postal: o erro aponta para a cidade | O erro está no campo `billing_city` — **falha: vem em `billing_country`** (bug [#5](https://github.com/evangelistaaj/Projeto-toolshop-api/issues/5)) |
| Faturas 🐞 | Cidade que não corresponde ao código postal: a mensagem refere o código postal | A mensagem menciona "postal", "postcode" ou "zip" — **falha: diz que a cidade não pertence ao país** (bug [#5](https://github.com/evangelistaaj/Projeto-toolshop-api/issues/5)) |
| Faturas 🐞 | Cidade que não corresponde ao código postal: formato do erro | `{"message": ..., "errors": {...}}`, como no resto da API — **falha** (bug [#6](https://github.com/evangelistaaj/Projeto-toolshop-api/issues/6)) |
| Faturas | Distrito vazio: a compra é recusada | Código 422; nenhuma fatura criada |
| Faturas 🐞 | Distrito vazio: a mensagem diz que o distrito é obrigatório | Erro no campo `billing_state`, com uma mensagem que diga "required" ou "obrigatório" — **falha: diz "must be a string"** (bug [#7](https://github.com/evangelistaaj/Projeto-toolshop-api/issues/7)) |
| Faturas 🐞 | Distrito vazio: formato do erro | `{"message": ..., "errors": {...}}` — **falha** (bug [#6](https://github.com/evangelistaaj/Projeto-toolshop-api/issues/6)) |
| Faturas | O número da fatura começa pelo ano atual | `INV-` + ano atual |
| Faturas | Duas compras seguidas têm números consecutivos | A sequência da segunda fatura = a da primeira + 1 |
| Faturas 🐞 | O número da fatura tem o formato das faturas da loja | `INV-` + ano + 7 algarismos de sequência, como os dados iniciais — **falha: tem 6** (bug [#8](https://github.com/evangelistaaj/Projeto-toolshop-api/issues/8)) |
| Stock ⏳ | Comprar todo o stock esgota o produto | Código 201; o produto fica esgotado, lido sem cache no carrinho da compra, até 90 s depois |
| Stock ⏳🐞 | O catálogo mostra o produto esgotado quando o stock acaba | Depois de o stock real acabar, o `GET /products/{id}` concorda — **falha: mostra "disponível" até 5 min** (bug [#10](https://github.com/evangelistaaj/Projeto-toolshop-api/issues/10)) |
| Stock 🐞 | Comprar mais unidades do que o stock disponível é recusado | Código 422; nenhuma fatura — **falha: a compra é aceite** (bug [#9](https://github.com/evangelistaaj/Projeto-toolshop-api/issues/9)) |
| Stock 🐞 | Juntar ao carrinho um produto esgotado é recusado | Código 422; o carrinho fica vazio — **falha: o produto é aceite** (bug [#9](https://github.com/evangelistaaj/Projeto-toolshop-api/issues/9)) |
| Desconto ecológico | Só produtos ecológicos (A e B) | Desconto de 5%: subtotal = soma de preço × quantidade; valor do desconto = 5% do subtotal; total = subtotal − desconto |
| Desconto ecológico | Sem produtos ecológicos (D e E) | Sem desconto; total = subtotal |
| Desconto ecológico | Maioria das unidades ecológicas (2 de 3) | Desconto de 5% |
| Desconto ecológico | Exatamente metade das unidades ecológicas (limite) | Sem desconto: a regra pede **mais** de metade |
| Desconto ecológico | 3 unidades ecológicas num só produto contra 2 produtos não ecológicos | Desconto de 5%: a regra conta **unidades**, não produtos |
| Desconto ecológico | Classificação B | Conta como ecológica: desconto de 5% |
| Desconto ecológico | Classificação C | Não conta como ecológica: sem desconto |
| Desconto ecológico 🐞 | A fatura devolvida na compra é igual à fatura guardada (3 × 9.99) | Subtotal, desconto e total iguais no `POST` e no `GET` — **falha: a compra devolve 1.4985 e 28.4715; a fatura guarda 1.50 e 28.47** (bug [#13](https://github.com/evangelistaaj/Projeto-toolshop-api/issues/13)) |
| Desconto ecológico 🐞 | O total é o subtotal menos o desconto, ao cêntimo (1 × 10.10) | Em cêntimos inteiros: total = subtotal − descontos — **falha: 10.10 − 0.51 = 9.59, mas o total é 9.60** (bug [#13](https://github.com/evangelistaaj/Projeto-toolshop-api/issues/13)) |
| Email de confirmação ⏳ | Todos os produtos e o total da fatura | O email chega (até 90 s); tem uma linha `<quantidade> x <nome>` por produto; o `Total` do email é o total da fatura |
| Email de confirmação ⏳🐞 | O email mostra o desconto ecológico | Linha `Eco-Friendly Discount (5%): -$ …` com a percentagem e o valor da fatura — **falha: a linha não aparece** (bug [#11](https://github.com/evangelistaaj/Projeto-toolshop-api/issues/11)) |
| Email de confirmação ⏳🐞 | O email indica o número da fatura | O email contém o `invoice_number` — **falha: não o indica** (bug [#12](https://github.com/evangelistaaj/Projeto-toolshop-api/issues/12)) |

> ⏳ O stock é descontado em segundo plano, por um agendador que corre uma vez por minuto. Os cenários lentos **repetem a verificação** de 5 em 5 segundos até o resultado aparecer (no máximo 90 s), sem esperas fixas. Antes de cada compra, confirma-se que o produto começa disponível: sem isso, "fica esgotado" passaria sem provar nada.

> 🌱 A regra do desconto ecológico não está documentada: veio do código-fonte da Toolshop (`InvoiceService`). Os cenários testam as partições (só ecológicos, nenhum, maioria) e os limites (exatamente metade; B conta, C não), cada um com produtos e preços criados pelo próprio cenário, para que as contas não dependam dos dados iniciais. Os valores de dinheiro são comparados em **cêntimos inteiros**, para não haver erros de vírgula flutuante, e o subtotal de 10.10 foi escolhido por ser um limite de arredondamento: 5% dá exatamente meio cêntimo (0.505).

> 📧 Para encontrar o email certo entre os de todas as execuções, cada produto criado pelos testes tem um nome único; o email da compra é o que menciona todos os produtos do cenário.

> 🎯 Os oráculos da numeração dependem só das faturas que o próprio cenário cria. Comparar com as faturas já existentes daria resultados diferentes conforme o número de execuções anteriores (a sequência das faturas novas vai subindo a cada compra).

> 🧹 Os cenários que criam produtos ou carrinhos apagam-nos no fim (hook `After`), por isso a base de dados fica como estava. Correm só na Toolshop local (tag `@so-local`).

---

## 🗺️ Plano

- [x] Estrutura do projeto (Cucumber + TypeScript)
- [x] World e hooks
- [x] Primeiro teste: catálogo de produtos
- [x] Autenticação
- [x] CRUD de produtos
- [x] Carrinho
- [x] Testes para os problemas encontrados na API (faturas e stock)
- [x] Carrinho com vários produtos e desconto ecológico
- [x] Email de confirmação da compra (servidor de email de testes)
- [ ] Métodos de pagamento *(a seguir)*
- [ ] Massa de teste em ficheiros JSON (moradas e produtos com nomes de negócio)
- [ ] Relatórios e integração contínua

---

## 🐞 Bugs encontrados

| # | Bug | Severidade | Estado |
|---|---|---|---|
| [#1](https://github.com/evangelistaaj/Projeto-toolshop-api/issues/1) | `POST /products` cria produtos **sem autenticação**: devolve `201` em vez de `401` | 🔴 Alta (segurança) | Aberto |
| [#2](https://github.com/evangelistaaj/Projeto-toolshop-api/issues/2) | `GET /postcode-lookup` devolve o **distrito vazio** para Portugal, França e Reino Unido, e o distrito é obrigatório na fatura | 🟠 Média (impede compras com a morada sugerida) | Aberto |
| [#3](https://github.com/evangelistaaj/Projeto-toolshop-api/issues/3) | `GET /postcode-lookup` **aceita entradas inválidas** (país inexistente, código postal com formato errado) e inventa uma morada | 🟠 Média | Aberto |
| [#4](https://github.com/evangelistaaj/Projeto-toolshop-api/issues/4) | `GET /postcode-lookup` devolve **estados dos EUA** para moradas argentinas | 🟠 Média | Aberto |
| [#5](https://github.com/evangelistaaj/Projeto-toolshop-api/issues/5) | `POST /invoices` com uma cidade que não corresponde ao código postal: o erro aponta para o **país** e a mensagem engana | 🟠 Média (o cliente não sabe o que corrigir) | Aberto |
| [#6](https://github.com/evangelistaaj/Projeto-toolshop-api/issues/6) | `POST /invoices`: os erros de validação **não seguem o formato** do resto da API | 🟡 Baixa | Aberto |
| [#7](https://github.com/evangelistaaj/Projeto-toolshop-api/issues/7) | `POST /invoices` com o distrito vazio: a mensagem diz **"must be a string"** em vez de dizer que o distrito é obrigatório | 🟠 Média (agravado pelo #2: afeta clientes de PT, FR e GB) | Aberto |
| [#8](https://github.com/evangelistaaj/Projeto-toolshop-api/issues/8) | `POST /invoices`: as faturas novas têm **um algarismo a menos** na sequência e a numeração **recomeça** abaixo das existentes (risco de números repetidos) | 🔴 Alta (documentos fiscais com números repetidos) | Aberto |
| [#9](https://github.com/evangelistaaj/Projeto-toolshop-api/issues/9) | A API **não verifica o stock**: aceita comprar mais unidades do que existem e juntar produtos esgotados ao carrinho | 🔴 Alta (vende o que não existe) | Aberto |
| [#10](https://github.com/evangelistaaj/Projeto-toolshop-api/issues/10) | `GET /products/{id}` mostra **stock desatualizado** até 5 minutos: a cache não é limpa quando o stock acaba | 🟠 Média (agrava o #9) | Aberto |
| [#11](https://github.com/evangelistaaj/Projeto-toolshop-api/issues/11) | Email de confirmação **não mostra o desconto ecológico**, embora o total já o tenha descontado: as linhas não batem com o total | 🟡 Baixa (confunde o cliente) | Aberto |
| [#12](https://github.com/evangelistaaj/Projeto-toolshop-api/issues/12) | Email de confirmação **não indica o número da fatura** | 🟡 Baixa (usabilidade) | Aberto |
| [#13](https://github.com/evangelistaaj/Projeto-toolshop-api/issues/13) | `POST /invoices` **não arredonda** o desconto ecológico nem o total: a resposta da compra difere da fatura guardada, e a fatura pode falhar **1 cêntimo** nas contas | 🟠 Média (valores de dinheiro incoerentes) | Aberto |

Os cenários que reproduzem bugs ainda por corrigir têm a tag `@bug-conhecido` e a tag do seu issue (por exemplo, `@issue-5`), e logo por baixo do título uma descrição com o bug e o link, que aparece também nos relatórios. A execução normal (`npm test`) exclui-os, para que qualquer falha nova salte à vista; para os correr à parte, `npm run test:bugs`.

## 🔍 Achados

Diferenças entre a documentação (Swagger) e o comportamento real da API, encontradas ao escrever os testes:

| Endpoint | Documentado | Real | Impacto |
|---|---|---|---|
| `POST /users/login` | Só a resposta 200 | Também `401` (`{"error": "Unauthorized"}`) para credenciais inválidas | ⚠️ Quem integra não sabe, pela documentação, como a API recusa um login |
| `POST /users/login` | `token_type: "Bearer"` | `token_type: "bearer"` | 🟡 Inconsistência sem efeito: o esquema não distingue maiúsculas |
| `POST /users/login` | `expires_in: 120` (exemplo) | `expires_in: 300` (5 minutos) | ℹ️ A duração real do token não está documentada |
| `POST /products` | Sucesso: `200` | Sucesso: `201 Created` | 🟡 O real segue a convenção REST; a documentação está errada |
| `POST /invoices` | Sucesso: `200` | Sucesso: `201 Created` | 🟡 A documentação está errada |
| `GET /carts/{id}` | A resposta só tem `id` | Tem também `cart_items`, cada um com `product_id`, `quantity` e o produto completo | ⚠️ O conteúdo do carrinho não está documentado |
| `DELETE /carts/{id}` e `DELETE /carts/{id}/product/{productId}` | Listam `401`, mas não estão marcados como protegidos | Funcionam sem login (normal num carrinho anónimo) | 🟡 A documentação contradiz-se |
| Erros de validação (ex.: `POST /carts/{id}` com quantidade 0) | `422` | `422` só com `Accept: application/json`; com `Accept: */*` a API redireciona para `/`, que devolve `404` | ⚠️ Um cliente que não peça JSON recebe um erro enganador. Os testes enviam sempre `Accept: application/json` |
| `POST /invoices` (stock) | Não documentado | O stock é descontado **em segundo plano** (fila `UpdateProductInventory` + agendador de minuto a minuto), até cerca de 1 minuto depois da compra | ℹ️ Quem integra tem de contar com este atraso |
| `POST /products`, `PUT` e `PATCH /products/{id}` | Sem autenticação exigida (só o `DELETE` está protegido) | O `POST` aceita mesmo pedidos sem login (ver bug [#1](https://github.com/evangelistaaj/Projeto-toolshop-api/issues/1)) | 🔴 Documentação e implementação concordam, mas na direção errada |
| Email de confirmação da compra | Não documentado | Enviado em segundo plano (fila `SendCheckoutEmail`), até cerca de 1 minuto depois da compra, com o assunto genérico **"Checkout"** | ℹ️ O assunto não identifica a loja nem a compra |
| Email de confirmação da compra | Não documentado | **Não indica o método de pagamento** escolhido, nem a morada de faturação | 🟡 O cliente não tem no email o registo de como pagou |

> 🔎 **Da investigação (não coberto por testes):** para o administrador, o `in_stock` devolve o **número** de unidades em stock, e não verdadeiro ou falso como documenta o Swagger. Confirmado no código-fonte da Toolshop (`Product::getInStockAttribute`) e observado uma vez; não foi possível reproduzir de forma consistente (provavelmente por causa da cache do #10).

### 💡 Próximos passos

- Reescrever este projeto em **Java + REST Assured + Cucumber-JVM**, como segunda stack do portfolio.

---

## 👤 Autor

**Arthur Evangelista** · [GitHub](https://github.com/evangelistaaj)
