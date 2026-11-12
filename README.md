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

| Cenários | Automatizados | Pendentes |
|---|---|---|
| 5 | 5 | 0 |

**O que já é verificado**

| Funcionalidade | Cenário | Verificações |
|---|---|---|
| Catálogo de produtos | Consultar o catálogo | Código HTTP 200, lista de produtos não vazia, tipos dos campos `id`, `name`, `price` e `in_stock` |
| Autenticação | Login com sucesso | Código 200, `access_token` em texto, `token_type` "bearer" (sem distinguir maiúsculas), `expires_in` numérico e positivo |
| Autenticação | Login com um email que não existe | Código 401 |
| Autenticação | Consultar os dados da conta depois do login | Código 200, campos da conta, **a password nunca é devolvida**, o email é o da conta com que se fez login |
| Autenticação | Consultar os dados da conta sem login | Código 401 |

---

## 🗺️ Plano

- [x] Estrutura do projeto (Cucumber + TypeScript)
- [x] World e hooks
- [x] Primeiro teste: catálogo de produtos
- [x] Autenticação
- [ ] CRUD de produtos e carrinho *(a seguir)*
- [ ] Testes para os problemas encontrados na API (faturas e stock)
- [ ] Relatórios e integração contínua

---

## 🔍 Achados

Diferenças entre a documentação (Swagger) e o comportamento real da API, encontradas ao escrever os testes:

| Endpoint | Documentado | Real | Impacto |
|---|---|---|---|
| `POST /users/login` | Só a resposta 200 | Também `401` (`{"error": "Unauthorized"}`) para credenciais inválidas | ⚠️ Quem integra não sabe, pela documentação, como a API recusa um login |
| `POST /users/login` | `token_type: "Bearer"` | `token_type: "bearer"` | 🟡 Inconsistência sem efeito: o esquema não distingue maiúsculas |
| `POST /users/login` | `expires_in: 120` (exemplo) | `expires_in: 300` (5 minutos) | ℹ️ A duração real do token não está documentada |

### 💡 Próximos passos

- Reescrever este projeto em **Java + REST Assured + Cucumber-JVM**, como segunda stack do portfolio.

---

## 👤 Autor

**Arthur Evangelista** · [GitHub](https://github.com/evangelistaaj)
