# 🧰 Projeto Toolshop API

Testes automatizados da API da **Toolshop** ([Practice Software Testing](https://practicesoftwaretesting.com)), escritos em **Gherkin em português** e executados com **Cucumber + Playwright + TypeScript**.

[![Testes da API](https://github.com/evangelistaaj/Projeto-toolshop-api/actions/workflows/testes-api.yml/badge.svg)](https://github.com/evangelistaaj/Projeto-toolshop-api/actions/workflows/testes-api.yml)
![Estado](https://img.shields.io/badge/estado-em%20constru%C3%A7%C3%A3o-yellow)
![Node](https://img.shields.io/badge/node-26-339933?logo=nodedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-7-3178C6?logo=typescript&logoColor=white)
![Cucumber](https://img.shields.io/badge/cucumber-13-23D96C?logo=cucumber&logoColor=white)
![Playwright](https://img.shields.io/badge/playwright-1.65-2EAD33?logo=playwright&logoColor=white)

> **Em resumo:** testes de API REST de uma loja online, escritos em **Gherkin (português)** e automatizados com **Cucumber + Playwright + TypeScript**. Destaques: World e hooks, dados próprios em cada cenário (criados e apagados pela API), testes de segurança (autorização, tokens e dados de cartão), a loja a correr em **Docker** na CI, e **23 bugs** reportados, cada um com um cenário que o reproduz.
>
> 🇬🇧 **In short:** REST API test suite for an e-commerce demo app, written in Gherkin (Portuguese) and automated with Cucumber + Playwright + TypeScript. Highlights: World and hooks, self-contained test data, security tests (authorization, tokens, card data), the app running in Docker in CI, and 23 reported bugs, each with a scenario that reproduces it.

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

> 🛡️ Os cenários que criam dados (produtos, carrinhos, compras) têm a tag `@so-local`. Quando o `API_URL` não é `localhost`, o `cucumber.js` exclui-os automaticamente: nunca criam dados num ambiente partilhado, como a API pública, nem por engano.

A versão do Node.js está em `.nvmrc` e no campo `engines` do `package.json`.

### ⏯️ Comandos

| Comando | O que corre |
|---|---|
| `npm test` | Todos os cenários, exceto os que reproduzem bugs conhecidos e os lentos (alguns segundos) |
| `npm run test:lento` | Só os cenários lentos (`@lento`), que esperam por processos em segundo plano (até 90 s cada). Arranca antes um processador da fila da Toolshop só para o teste |
| `npm run test:bugs` | Só os cenários que reproduzem bugs conhecidos (`@bug-conhecido`), com o resumo das falhas em `resultados/bugs.txt`. Arranca antes um processador da fila, como o `test:lento` |
| `npm run test:limpo` | Repõe os dados da Toolshop local e corre `npm test` |
| `npm run typecheck` | Verifica os tipos do TypeScript em todo o projeto, sem correr os testes |
| `npm run test:unit` | Testes unitários das verificações e das funções de apoio (menos de 1 s, sem Toolshop) |
| `npx cucumber-js -p bugs --tags @issue-5` | Só os cenários de um bug (cada um tem a tag do seu issue). O `-p bugs` é preciso: as tags da linha de comandos juntam-se às do perfil, e o perfil normal exclui os bugs conhecidos |

### 🤖 Integração contínua

A cada `push` para o `main` (e em cada pull request), o GitHub Actions (`.github/workflows/testes-api.yml`):

1. arranca a Toolshop em Docker, com o mesmo `docker-compose.prod.yml` do ambiente local, e o servidor de email de testes;
2. instala as dependências, verifica os tipos do TypeScript e corre os testes unitários;
3. repõe os dados da Toolshop;
4. corre os cenários normais e os lentos (se algum falhar, a execução fica a vermelho);
5. corre os bugs conhecidos, só para o relatório (falham de propósito e não põem a execução a vermelho);
6. publica os relatórios HTML como artefacto (`relatorios`), na página de cada execução, no separador **Actions**.

Também pode ser corrida à mão, no separador **Actions** → *Testes da API* → *Run workflow*. Uma execução completa demora 2 a 3 minutos.

> 🧬 As imagens do servidor web e do agendador da Toolshop estão publicadas só para ARM (`linux/arm64`), e as máquinas do GitHub são x86 (`amd64`). Sem mais nada, esses contentores não correm e a API não responde. A pipeline ativa a emulação ARM (QEMU, com `docker/setup-qemu-action`) antes de arrancar a Toolshop; a API e a base de dados correm de forma nativa.

### 📊 Relatórios

Cada execução grava um relatório HTML na pasta `resultados/` (ignorada pelo Git), com cada cenário, os seus passos e as mensagens de falha:

| Comando | Relatório |
|---|---|
| `npm test` | `resultados/relatorio.html` |
| `npm run test:lento` | `resultados/lento.html` |
| `npm run test:bugs` | `resultados/bugs.html` e o resumo em texto `resultados/bugs.txt` |

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
| `npm run db:reset` | Repõe a base de dados da Toolshop local com os dados iniciais e apaga os PDF das faturas |
| `npm run test:limpo` | Repõe os dados e corre todos os testes |

> ⚠️ A reposição apaga **tudo** o que foi criado na Toolshop local, incluindo dados criados à mão na interface.

> 📄 Os PDF das faturas ficam guardados em ficheiros, fora da base de dados, e a reposição da base de dados não os apaga. Como a numeração das faturas recomeça depois de uma reposição (ver bug #8), uma fatura nova podia ficar com o número de uma fatura antiga, e a Toolshop entregava o PDF antigo e não gerava o novo. Por isso, o `db:reset` corre também o `php artisan invoice:remove`, como a própria Toolshop faz de hora a hora no ambiente público.

### 🔑 Contas de teste

Os testes usam contas criadas pelos dados iniciais da Toolshop: um cliente (`customer2@practicesoftwaretesting.com`), um segundo cliente para os cenários de autorização (`customer3@practicesoftwaretesting.com`, que tem uma password diferente das outras) e o administrador. São credenciais públicas de uma aplicação de treino, definidas em `support/contas.ts`, e podem ser trocadas sem mexer no código, com as variáveis abaixo.

Os cenários de registo e de bloqueio de conta usam sempre **contas acabadas de registar** (nomes de `dados/clientes.json`, emails únicos em `@example.com`), que são apagadas no fim de cada cenário.

| Variável | Para que serve |
|---|---|
| `CLIENTE_EMAIL` / `CLIENTE_PASSWORD` | Conta de cliente |
| `OUTRO_CLIENTE_EMAIL` / `OUTRO_CLIENTE_PASSWORD` | Segundo cliente ("o outro cliente") |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Conta de administrador |
| `TOOLSHOP_CONTENTOR` | Contentor Docker da API local (por omissão `pst-laravel-api-1`), usado para gerar o PDF de uma fatura na preparação de um cenário |

> 🔒 Tokens e passwords nunca aparecem nas mensagens de falha: são substituídos por `***` antes de serem mostrados (`support/seguranca.ts`).

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
| 121 | 80 | 41 | 0 | 23 |

> Um esquema de cenário conta uma execução por exemplo, e um bug pode ser reproduzido por várias execuções: as 41 execuções a vermelho correspondem a **23 bugs** — #1 (1 execução), #2 (3: Portugal, França e Reino Unido), #3 (1), #4 (1), #5 (2: campo e mensagem do erro), #6 (2: formato do erro da cidade e do distrito), #7 (1), #8 (1), #9 (2: compra acima do stock e produto esgotado no carrinho) #10 (1), #11 (1), #12 (1), #13 (2: resposta da compra diferente da fatura guardada e contas que falham por 1 cêntimo) #14 (4: CVV de 3 e de 4 algarismos, dois números de cartão) #15 (1) #16 (4: três cartões inválidos e uma conta com letras, numa compra), #17 (4: alterar o preço sem login e como cliente, com `PUT` e com `PATCH`), #18 (2: estado da fatura de outro cliente e da própria) #19 (1), #20 (3: faz 18 anos hoje, faz 75 e faz 80 anos hoje), #21 (1), #22 (1) e #23 (1).

**O que já é verificado**

| Funcionalidade | Cenário | Verificações |
|---|---|---|
| Catálogo de produtos | Consultar o catálogo | Código HTTP 200, lista de produtos não vazia, tipos dos campos `id`, `name`, `price` e `in_stock` |
| Catálogo de produtos | A segunda página continua onde a primeira acabou | Página 2, 9 produtos, do 10.º ao 18.º (`current_page`, `per_page`, `from`, `to`) |
| Catálogo de produtos | Uma página depois da última | Código 200, lista vazia, `from` e `to` a `null` (a página pedida vem do `last_page` da própria resposta) |
| Catálogo de produtos | Percorrer todas as páginas, por omissão, por nome crescente e por preço decrescente | Recebem-se tantos produtos como o `total` indicado, **sem repetidos** entre páginas (uma ordenação instável faria produtos saltar de página) |
| Autenticação | Login com sucesso | Código 200, `access_token` em texto, `token_type` "bearer" (sem distinguir maiúsculas), `expires_in` numérico e positivo |
| Autenticação | Login com um email que não existe | Código 401 |
| Autenticação | Consultar os dados da conta depois do login | Código 200, campos da conta, **a password nunca é devolvida**, o email é o da conta com que se fez login |
| Autenticação | Consultar os dados da conta sem login | Código 401 |
| Autenticação | Um token que não é um JWT | Código 401 |
| Autenticação | Um token de cliente alterado para o perfil de administrador (`role: admin`), a pedir a lista de clientes | Código 401: o conteúdo mudou e a assinatura deixou de corresponder (**escalada de privilégios recusada**) |
| Autenticação | Um token sem assinatura (`alg: none`) | Código 401 |
| Autenticação | O token depois de terminar a sessão (`/users/logout`) | Código 401: o logout invalida o token |
| Autenticação (local) | Um token expirado há 1 minuto / que expira daqui a 5 minutos | Código 401 / 200: o segundo é o controlo, que prova que a recusa vem da data e não da assinatura |
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
| Pesquisa de morada | Código postal português com formato inválido (`1000-01`; o formato é `0000` ou `0000-000`) | Código 422 |
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
| Pagamentos | Comprar com cada um dos 5 métodos (contra-reembolso, cartão de crédito, transferência bancária, cartão-oferta, pagamento a prestações) | Código 201; a fatura, consultada à parte, regista o método usado |
| Pagamentos | Verificação de um cartão de crédito com dados válidos e com CVV de 4 algarismos | `POST /payment/check`: código 200, "Payment was successful" |
| Pagamentos 🐞 | Verificação de um cartão com a validade no mês atual (limite) | Código 200 — **falha: recusa o cartão durante todo o mês da validade** (bug [#15](https://github.com/evangelistaaj/Projeto-toolshop-api/issues/15)) |
| Pagamentos | Verificação de um cartão com dados inválidos: validade no mês passado; CVV com 2 e com 5 algarismos; número sem hífenes e com letras; titular com algarismos | Código 422, com erro **só** no campo alterado (cada exemplo parte de dados válidos e muda um campo) |
| Pagamentos | Verificação de uma transferência bancária: dados válidos; número da conta com letras | 200; 422 só no número da conta |
| Pagamentos | Verificação de um cartão-oferta: 16 caracteres e código de 4 (válido); número com 15 e com 17; código com 3 | 200; 422 só no campo alterado |
| Pagamentos 🐞 | Comprar com um cartão inválido (número com letras, expirado, CVV com 2 algarismos) ou uma conta com letras | `POST /invoices`: código 422 e nenhuma fatura, como na verificação — **falha: a compra é aceite e cria a fatura** (bug [#16](https://github.com/evangelistaaj/Projeto-toolshop-api/issues/16)) |
| Pagamentos | Comprar com um cartão-oferta de 15 caracteres (controlo) | Código 422 e nenhuma fatura: a compra valida o cartão-oferta, o que prova que o teste distingue os dois comportamentos |
| Pagamentos 🐞 | A fatura não mostra o código de segurança do cartão (CVV de 3 e de 4 algarismos) | Compra com cartão de crédito; a fatura tem o pagamento com cartão; nenhum campo com nome de código de segurança (`cvv`, `cvc`, `security_code`), a qualquer profundidade, tem valor — **falha: devolve `payment.payment_details.cvv`** (bug [#14](https://github.com/evangelistaaj/Projeto-toolshop-api/issues/14)) |
| Pagamentos 🐞 | A fatura não mostra o número completo do cartão (dois números) | O número não aparece em lado nenhum da resposta, nem com hífenes nem só com algarismos (o número mascarado é aceite) — **falha: vem completo** (bug [#14](https://github.com/evangelistaaj/Projeto-toolshop-api/issues/14)) |
| Autorização | Um cliente não consegue ver a fatura de outro cliente | Código 401, 403 ou 404, e a resposta não contém o número da fatura |
| Autorização 🐞 | Um cliente não consegue mudar o estado da fatura de outro cliente | Recusa e, confirmado pelo dono, a fatura não fica concluída — **falha: 200, aceite** (bug [#18](https://github.com/evangelistaaj/Projeto-toolshop-api/issues/18)) |
| Autorização 🐞 | Um cliente não consegue descarregar o PDF da fatura de outro cliente | Depois de confirmar que o dono descarrega o PDF: recusa, e a resposta não é um PDF — **falha: entrega o PDF** (bug [#19](https://github.com/evangelistaaj/Projeto-toolshop-api/issues/19)) |
| Autorização 🐞 | Alterar o preço de um produto sem login, e como cliente, com `PUT` (o produto inteiro) e com `PATCH` (só o preço) | Recusa, e o produto mantém o preço — **falha: 200, o preço muda** (bug [#17](https://github.com/evangelistaaj/Projeto-toolshop-api/issues/17)) |
| Autorização | Um cliente não consegue apagar um produto | Código 403, e o produto continua no catálogo |
| Autorização 🐞 | Um cliente não consegue mudar o estado da sua própria fatura | Recusa, e a fatura não fica concluída — **falha: 200, aceite** (bug [#18](https://github.com/evangelistaaj/Projeto-toolshop-api/issues/18)) |
| Registo | Registo com dados válidos | Código 201; o login com a conta nova funciona; os dados da conta (`/users/me`) são os enviados |
| Registo | Idade: fez 18 anos ontem, faz 75 anos amanhã (ainda 74) | Aceite |
| Registo 🐞 | Idade: faz 18 anos hoje | Aceite — **falha: recusado** (bug [#20](https://github.com/evangelistaaj/Projeto-toolshop-api/issues/20)) |
| Registo | Idade: faz 18 anos amanhã | Recusado (422, só em `dob`) |
| Registo 🐞 | Idade: faz 75 anos hoje, faz 80 anos hoje | Recusado — **falha: aceite; o limite real é 93 anos** (bug [#20](https://github.com/evangelistaaj/Projeto-toolshop-api/issues/20)) |
| Registo | Password sem maiúsculas, sem algarismos, sem símbolos, com 7 caracteres | 422, só em `password` |
| Registo 🐞 | Email sem formato de email | 422 — **falha: aceite** (bug [#22](https://github.com/evangelistaaj/Projeto-toolshop-api/issues/22)) |
| Registo 🐞 | Código postal português inválido (`1000-01`) | 422 — **falha: aceite na versão publicada** (bug [#23](https://github.com/evangelistaaj/Projeto-toolshop-api/issues/23)) |
| Registo 🐞 | Registo sem data de nascimento | 422 — **falha: aceite** (bug [#21](https://github.com/evangelistaaj/Projeto-toolshop-api/issues/21)) |
| Registo | Email que já tem conta | **409** (conflito; decisão da Toolshop), com erro em `email` |
| Registo | Registo a pedir o perfil de administrador | A conta fica cliente: perfil `user` no token, e a lista de utilizadores é recusada (403) |
| Bloqueio de conta | Três tentativas falhadas | A 4.ª tentativa, com a password certa, dá 423 ("Account locked") |
| Bloqueio de conta | Duas falhas e um login certo | O contador reinicia: mais duas falhas não bloqueiam |
| Bloqueio de conta | Password errada | A resposta é igual à de um email que não existe (não revela que a conta existe) |

---

## 🧱 Boas práticas e decisões

> ⏳ O stock é descontado em segundo plano, por um agendador que corre uma vez por minuto. Os cenários lentos **repetem a verificação** de 5 em 5 segundos até o resultado aparecer (no máximo 90 s), sem esperas fixas. Antes de cada compra, confirma-se que o produto começa disponível: sem isso, "fica esgotado" passaria sem provar nada.

> 🚦 Na Toolshop, os trabalhos em segundo plano (desconto de stock, email) são processados pelo agendador, que arranca o processador da fila uma vez por minuto. **Causa medida:** a cada minuto, o `invoice:generate` põe na fila um PDF (`CreateInvoicePDF`) para cada fatura que ainda não o tenha. Depois de `npm run db:reset`, são as 200 faturas da demonstração de uma vez. O agendador corre em emulação ARM (`qemu-aarch64`), também no Docker Desktop do Windows, e cada PDF demorou em média **~2 s**. A fila levou **~4 minutos** a esvaziar, e o desconto de stock e o email de uma compra feita nesse intervalo ficavam atrás dos PDFs, a passar dos 90 s.
>
> A prova foi feita em dois sentidos. Logo a seguir ao reset, sem processador próprio, os cenários lentos **falharam**. Com a fila já vazia, os mesmos cenários **passaram** em 38 s, e os trabalhos da compra saíram da fila em menos de um minuto. Como a pipeline faz sempre `db:reset` antes dos testes, apanharia sempre a fila cheia.
>
> Por isso, o `npm run test:lento` e o `npm run test:bugs` arrancam primeiro **o seu próprio processador da fila**, em segundo plano (`docker exec -d ... php artisan queue:work --max-time=300`), que se desliga sozinho ao fim de 5 minutos. O código que desconta o stock e envia o email continua a ser o da Toolshop; os cenários deixam só de depender do horário do agendador. O limite de 90 s mantém-se.
>
> O `test:bugs` precisa dele pela mesma razão, e com uma consequência pior: os cenários dos bugs do email (#11 e #12) chegaram a falhar por o email **não chegar a tempo**, em vez de falharem na verificação do bug. Um cenário de bug que falha pela razão errada esconde se o bug ainda existe: se o bug fosse corrigido, o cenário continuava vermelho, e ninguém dava por isso.

> 🧪 **Testar os testes.** As verificações mais delicadas (dados de cartão expostos, produtos repetidos entre páginas), os tokens alterados e as datas relativas vivem em funções próprias (`support/oraculos.ts`, `support/jwt.ts`, `support/datas.ts`) e têm testes unitários com dados inventados (`npm run test:unit`): cada verificação é posta à prova com um caso que tem de apanhar e um controlo que tem de deixar passar. Para confirmar que estes testes têm valor, o código foi sabotado de propósito (por exemplo, `repetidos` a nunca encontrar nada); uma das sabotagens não foi apanhada à primeira, e isso levou a um teste novo. As datas usam um relógio simulado: incluem a passagem de ano, o 29 de fevereiro e o fuso horário.

> 🧭 **A fonte de verdade é a versão que corre.** O código-fonte da Toolshop no GitHub serve para encontrar suspeitas, mas a imagem publicada no Docker Hub pode ser mais antiga (foi assim com o código postal no registo, #23). Por isso, cada suspeita só vira issue depois de um teste a confirmar contra a aplicação real.

> 🔐 Os cenários de autorização confirmam sempre duas coisas: o código de recusa (401, 403 ou 404; esconder que o recurso existe também é uma boa prática) e que **nada mudou** (o preço, o estado da fatura), consultado à parte. Uma API pode responder com uma recusa e alterar na mesma. O estado da fatura é verificado como "não fica concluída", e não "mantém o estado", porque a Toolshop avança os estados sozinha de 10 em 10 minutos (`order:update`). Para o cenário do PDF não depender do agendador, a preparação gera o PDF dessa fatura com o próprio código da Toolshop (`docker exec ... CreateInvoicePDF::dispatchSync`) e confirma que o dono o descarrega.

> 🔑 Para testar um token expirado sem esperar os 5 minutos de validade, o cenário pede um token verdadeiro e assina-o de novo, com outras datas, usando o segredo da Toolshop local (lido por `docker exec`, `config('jwt.secret')`, e nunca escrito em registos). O mesmo mecanismo cria o token "ainda válido" do controlo. As alterações de tokens estão em `support/jwt.ts`, só com o `crypto` do Node.

> 📚 Os cenários da paginação só fazem leituras e correm também contra a API pública (confirmado: 50 produtos em 6 páginas, contra os da Toolshop local). Por isso, nenhum oráculo fixa o tamanho do catálogo: usam o `total` e o `last_page` da própria resposta. Observações que não são bugs: o parâmetro `per_page` é ignorado (são sempre 9 por página), e `page=0`, `page=-1` ou `page=abc` são tratados como a página 1, em vez de serem recusados.

> 🌱 A regra do desconto ecológico não está documentada: veio do código-fonte da Toolshop (`InvoiceService`). Os cenários testam as partições (só ecológicos, nenhum, maioria) e os limites (exatamente metade; B conta, C não), cada um com produtos e preços criados pelo próprio cenário, para que as contas não dependam dos dados iniciais. Os valores de dinheiro são comparados em **cêntimos inteiros**, para não haver erros de vírgula flutuante, e o subtotal de 10.10 foi escolhido por ser um limite de arredondamento: 5% dá exatamente meio cêntimo (0.505).

> 📧 Para encontrar o email certo entre os de todas as execuções, cada produto criado pelos testes tem um nome único; o email da compra é o que menciona todos os produtos do cenário.

> 💳 Os dados de cartão dos testes são **números de teste inventados** e só correm na Toolshop local. A validade é escrita de forma relativa ("daqui a 2 anos") e calculada a partir da data de hoje, para que os cenários nunca caduquem. Nos cenários em que os dados do pagamento não são o tema, o Gherkin diz só o nome do método ("cartão-oferta") e o código usa dados válidos de exemplo, num dicionário em `support/pagamentos.ts` com um tipo de parâmetro próprio (`{metodo}`).

> 🎯 Os oráculos da numeração dependem só das faturas que o próprio cenário cria. Comparar com as faturas já existentes daria resultados diferentes conforme o número de execuções anteriores (a sequência das faturas novas vai subindo a cada compra).

> 🧹 Os cenários que criam produtos ou carrinhos apagam-nos no fim (hook `After`), por isso a base de dados fica como estava. Correm só na Toolshop local (tag `@so-local`, excluída automaticamente com outro `API_URL`).

---

## 🐞 Bugs encontrados

| # | Bug | Severidade | Estado |
|---|---|---|---|
| [#1](https://github.com/evangelistaaj/Projeto-toolshop-api/issues/1) | `POST /products` cria produtos **sem autenticação**: devolve `201` em vez de `401` | 🔴 Alta (segurança) | Aberto |
| [#2](https://github.com/evangelistaaj/Projeto-toolshop-api/issues/2) | `GET /postcode-lookup` devolve o **distrito vazio** para Portugal, França e Reino Unido, e o distrito é obrigatório na fatura | 🟠 Média (impede compras com a morada sugerida) | Aberto |
| [#3](https://github.com/evangelistaaj/Projeto-toolshop-api/issues/3) | `GET /postcode-lookup` **aceita um país que não existe** (`XX`) e inventa uma morada americana | 🟠 Média | Aberto |
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
| [#14](https://github.com/evangelistaaj/Projeto-toolshop-api/issues/14) | `GET /invoices/{id}` devolve os **dados do cartão completos, incluindo o CVV**: a API guarda o código de segurança e o número sem mascarar | 🔴 Alta (segurança: exposição de dados de pagamento, contra o PCI DSS) | Aberto |
| [#15](https://github.com/evangelistaaj/Projeto-toolshop-api/issues/15) | `POST /payment/check` **recusa cartões no mês da validade**: `MM/AAAA` é lido como o dia 1 desse mês | 🟠 Média (impede pagamentos com cartões válidos) | Aberto |
| [#16](https://github.com/evangelistaaj/Projeto-toolshop-api/issues/16) | `POST /invoices` **não valida os dados do pagamento** (só o cartão-oferta): aceita compras com cartões expirados ou inválidos e contas com letras | 🔴 Alta (compras aceites com meios de pagamento inválidos) | Aberto |
| [#17](https://github.com/evangelistaaj/Projeto-toolshop-api/issues/17) | `PUT`/`PATCH /products/{id}` **sem autenticação nem autorização**: qualquer pessoa, mesmo sem login, altera os produtos e os preços | 🔴 Alta (segurança: OWASP API5) | Aberto |
| [#18](https://github.com/evangelistaaj/Projeto-toolshop-api/issues/18) | `PUT /invoices/{id}/status` **sem autorização**: qualquer cliente muda o estado de qualquer fatura, a sua e a de outros | 🔴 Alta (segurança: OWASP API1 e API5) | Aberto |
| [#19](https://github.com/evangelistaaj/Projeto-toolshop-api/issues/19) | `GET /invoices/{número}/download-pdf` **sem verificação do dono**: qualquer cliente descarrega o PDF da fatura de outro, e os números são sequenciais | 🔴 Alta (segurança: OWASP API1, dados pessoais) | Aberto |
| [#20](https://github.com/evangelistaaj/Projeto-toolshop-api/issues/20) | `POST /users/register`: **limites de idade errados**: quem faz 18 anos hoje é recusado, e o limite de 75 anos só funciona a partir dos 93 | 🟠 Média | Aberto |
| [#21](https://github.com/evangelistaaj/Projeto-toolshop-api/issues/21) | `POST /users/register` aceita registos **sem data de nascimento**: a idade nunca é verificada | 🟠 Média | Aberto |
| [#22](https://github.com/evangelistaaj/Projeto-toolshop-api/issues/22) | `POST /users/register` aceita **emails sem formato de email** | 🟠 Média | Aberto |
| [#23](https://github.com/evangelistaaj/Projeto-toolshop-api/issues/23) | `POST /users/register` **não valida o formato do código postal** na versão publicada (já corrigido no código-fonte) | 🟡 Baixa | Aberto |

Os cenários que reproduzem bugs ainda por corrigir têm a tag `@bug-conhecido` e a tag do seu issue (por exemplo, `@issue-5`), e logo por baixo do título uma descrição com o bug e o link, que aparece também nos relatórios. A execução normal (`npm test`) exclui-os, para que qualquer falha nova salte à vista; para os correr à parte, `npm run test:bugs`. Quando só alguns exemplos de um esquema reproduzem um bug, ficam num bloco `Exemplos` à parte, com as tags e a descrição do bug, e os restantes continuam a correr normalmente.

## 🔍 Descobertas

Diferenças entre a documentação (Swagger) e o comportamento real da API, e outras observações que não são bugs, encontradas ao escrever os testes:

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

---

## 📂 Estrutura

```
features/    Cenários em Gherkin (português), um ficheiro por funcionalidade
steps/       Definições dos passos, um ficheiro por funcionalidade (e comum.steps.ts)
support/     world.ts e hooks.ts      estado de cada cenário, preparação e limpeza
             contas.ts                contas de teste (variáveis de ambiente)
             autenticacao.ts, jwt.ts  login e manipulação de tokens
             produtos.ts, clientes.ts, pagamentos.ts, referencia.ts, dados.ts
                                      dados de teste (a partir da pasta dados/)
             carrinho.ts, compras.ts, faturas.ts
                                      carrinho, compras e consulta das faturas
             oraculos.ts, datas.ts    verificações e datas relativas (testadas à parte)
             seguranca.ts             tokens e passwords escondidos nas mensagens
             toolshop-local.ts        comandos na Toolshop local (docker exec)
dados/       Massa de teste em JSON: produtos, clientes, países, províncias e pagamentos
testes/      Testes unitários das verificações e das funções de apoio (node:test)
cucumber.js  Configuração do Cucumber: perfis normal, lento e bugs
.nvmrc       Versão do Node.js
.vscode/     Configuração da extensão Cucumber do VS Code (navegação e autocompletar dos passos)
.github/     Integração contínua (GitHub Actions)
```
### 🧪 Massa de teste

Os dados de fundo dos cenários vivem em ficheiros JSON, na pasta `dados/`, separados do código:

| Ficheiro | Conteúdo |
|---|---|
| `produtos.json` | Produtos do catálogo com nomes e descrições de negócio, em inglês como o resto da Toolshop. Cada produto criado por um cenário recebe uma referência única no nome (ex.: `Claw Hammer with Fiberglass Handle - ref. MHO7X2K9A3F`) |
| `paises.json` | Os países dos cenários ("Portugal") e o código ISO que a API espera (`PT`) |
| `provincias-argentina.json` | As 24 províncias argentinas, para verificar a pesquisa de morada |
| `clientes.json` | Nomes e apelidos portugueses para as contas registadas pelos cenários |
| `pagamentos.json` | Dados válidos de cada método de pagamento, com os nomes dos campos em português, iguais aos do Gherkin |

Os dados que são o **tema** de um cenário (por exemplo, o código postal pesquisado ou um cartão inválido) ficam no próprio `.feature`, à vista de quem o lê. Para os ficheiros JSON vão só os dados de fundo. Um nome que não esteja na massa de teste (um país, um campo de pagamento) faz o teste falhar com uma mensagem clara, em vez de enviar à API um valor inventado.

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
- [x] Métodos de pagamento (registo de cada método, verificação dos dados, compra com dados inválidos e dados sensíveis do cartão)
- [x] Massa de teste em ficheiros JSON (produtos com nomes de negócio, países, províncias e pagamentos)
- [x] Autorização: dados de outros clientes e funções reservadas ao administrador (OWASP API1 e API5)
- [x] Registo de cliente e bloqueio de conta
- [x] Tokens inválidos: alterado, sem assinatura, expirado e depois do logout
- [x] Catálogo: paginação (próximo: pesquisa, filtros e ordenação)
- [x] Relatórios HTML
- [x] Integração contínua (GitHub Actions), com a Toolshop em Docker
- [x] Testes unitários das verificações e das funções de apoio, com sabotagens a confirmar que falham quando devem

### 💡 Próximos passos

- Contrato das respostas com JSON Schema (`ajv`)
- Catálogo: pesquisa, filtros e ordenação
- Endpoints do Swagger ainda sem testes, por ordem de risco: utilizadores (ver e alterar outros, `role`), marcas e categorias sem login, relatórios, lista de faturas, alteração e recuperação de password, favoritos
- Mensagens de falha mais legíveis no terminal
- Reescrever este projeto em **Java + REST Assured + Cucumber-JVM**, como segunda stack do portfolio

---

## 👤 Autor

**Arthur Evangelista** · [GitHub](https://github.com/evangelistaaj)
