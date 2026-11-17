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

| Cenários | Automatizados ✅ | Bugs conhecidos 🐞 | Pendentes |
|---|---|---|---|
| 26 | 19 | 7 | 0 |

> Os esquemas de cenário contam uma vez por exemplo.

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
| Pesquisa de morada | Morada completa para DE, ES e BR | Código 200; rua, cidade e distrito preenchidos; país e código postal iguais aos pesquisados |
| Pesquisa de morada 🐞 | Morada completa para PT, FR e GB | O mesmo oráculo — **falha: distrito vazio** (bug [#2](https://github.com/evangelistaaj/Projeto-toolshop-api/issues/2)) |
| Pesquisa de morada 🐞 | País que não existe (XX) | Código 422 — **falha: devolve 200 com uma morada americana** (bug [#3](https://github.com/evangelistaaj/Projeto-toolshop-api/issues/3)) |
| Pesquisa de morada 🐞 | Código postal português com formato inválido (`1000`) | Código 422 — **falha: devolve 200** (bug [#3](https://github.com/evangelistaaj/Projeto-toolshop-api/issues/3)) |
| Pesquisa de morada 🐞 | Argentina | O distrito é uma das 24 províncias argentinas (sem distinguir acentos nem maiúsculas) — **falha: devolve "Illinois"** (bug [#4](https://github.com/evangelistaaj/Projeto-toolshop-api/issues/4)) |

> 🧹 Os cenários que criam produtos ou carrinhos apagam-nos no fim (hook `After`), por isso a base de dados fica como estava. Correm só na Toolshop local (tag `@so-local`).

---

## 🗺️ Plano

- [x] Estrutura do projeto (Cucumber + TypeScript)
- [x] World e hooks
- [x] Primeiro teste: catálogo de produtos
- [x] Autenticação
- [x] CRUD de produtos
- [x] Carrinho
- [ ] Testes para os problemas encontrados na API (faturas e stock) *(a seguir)*
- [ ] Relatórios e integração contínua

---

## 🐞 Bugs encontrados

| # | Bug | Severidade | Estado |
|---|---|---|---|
| [#1](https://github.com/evangelistaaj/Projeto-toolshop-api/issues/1) | `POST /products` cria produtos **sem autenticação**: devolve `201` em vez de `401` | 🔴 Alta (segurança) | Aberto |
| [#2](https://github.com/evangelistaaj/Projeto-toolshop-api/issues/2) | `GET /postcode-lookup` devolve o **distrito vazio** para PT, FR e GB, e o distrito é obrigatório na fatura | 🟠 Média (impede compras com a morada sugerida) | Aberto |
| [#3](https://github.com/evangelistaaj/Projeto-toolshop-api/issues/3) | `GET /postcode-lookup` **aceita entradas inválidas** (país inexistente, código postal com formato errado) e inventa uma morada | 🟠 Média | Aberto |
| [#4](https://github.com/evangelistaaj/Projeto-toolshop-api/issues/4) | `GET /postcode-lookup` devolve **estados dos EUA** para moradas argentinas | 🟠 Média | Aberto |

Os cenários que reproduzem bugs ainda por corrigir têm a tag `@bug-conhecido`. A execução normal (`npm test`) exclui-os, para que qualquer falha nova salte à vista; para os correr à parte, `npm run test:bugs`.

## 🔍 Achados

Diferenças entre a documentação (Swagger) e o comportamento real da API, encontradas ao escrever os testes:

| Endpoint | Documentado | Real | Impacto |
|---|---|---|---|
| `POST /users/login` | Só a resposta 200 | Também `401` (`{"error": "Unauthorized"}`) para credenciais inválidas | ⚠️ Quem integra não sabe, pela documentação, como a API recusa um login |
| `POST /users/login` | `token_type: "Bearer"` | `token_type: "bearer"` | 🟡 Inconsistência sem efeito: o esquema não distingue maiúsculas |
| `POST /users/login` | `expires_in: 120` (exemplo) | `expires_in: 300` (5 minutos) | ℹ️ A duração real do token não está documentada |
| `POST /products` | Sucesso: `200` | Sucesso: `201 Created` | 🟡 O real segue a convenção REST; a documentação está errada |
| `GET /carts/{id}` | A resposta só tem `id` | Tem também `cart_items`, cada um com `product_id`, `quantity` e o produto completo | ⚠️ O conteúdo do carrinho não está documentado |
| `DELETE /carts/{id}` e `DELETE /carts/{id}/product/{productId}` | Listam `401`, mas não estão marcados como protegidos | Funcionam sem login (normal num carrinho anónimo) | 🟡 A documentação contradiz-se |
| Erros de validação (ex.: `POST /carts/{id}` com quantidade 0) | `422` | `422` só com `Accept: application/json`; com `Accept: */*` a API redireciona para `/`, que devolve `404` | ⚠️ Um cliente que não peça JSON recebe um erro enganador. Os testes enviam sempre `Accept: application/json` |
| `POST /products`, `PUT` e `PATCH /products/{id}` | Sem autenticação exigida (só o `DELETE` está protegido) | O `POST` aceita mesmo pedidos sem login (ver bug [#1](https://github.com/evangelistaaj/Projeto-toolshop-api/issues/1)) | 🔴 Documentação e implementação concordam, mas na direção errada |

### 💡 Próximos passos

- Reescrever este projeto em **Java + REST Assured + Cucumber-JVM**, como segunda stack do portfolio.

---

## 👤 Autor

**Arthur Evangelista** · [GitHub](https://github.com/evangelistaaj)
