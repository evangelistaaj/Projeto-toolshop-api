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

**Pré-requisitos:** Node.js 26 ou superior e Git.

```bash
git clone https://github.com/evangelistaaj/Projeto-toolshop-api.git
cd Projeto-toolshop-api
npm install
npm test
```

> ℹ️ Não é preciso instalar browsers: os testes de API não abrem nenhum.

---

## 📂 Estrutura

```
features/    Cenários em Gherkin (português)
steps/       Definições dos passos, um ficheiro por funcionalidade
support/     World (estado de cada cenário) e código de suporte
cucumber.js  Configuração do Cucumber
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
| 1 | 0 | 1 |

---

## 🗺️ Plano

- [x] Estrutura do projeto (Cucumber + TypeScript)
- [ ] World e hooks *(em curso)*
- [ ] Primeiro teste: catálogo de produtos
- [ ] Autenticação
- [ ] CRUD de produtos e carrinho
- [ ] Testes para os problemas encontrados na API (faturas e stock)
- [ ] Relatórios e integração contínua

### 💡 Próximos passos

- Reescrever este projeto em **Java + REST Assured + Cucumber-JVM**, como segunda stack do portfolio.

---

## 👤 Autor

**Arthur Evangelista** · [GitHub](https://github.com/evangelistaaj)
