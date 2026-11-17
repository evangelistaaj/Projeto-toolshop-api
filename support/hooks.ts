import { Before, After } from '@cucumber/cucumber';
import { request } from '@playwright/test';
import type { MundoToolshop } from './world';
import { apagarProdutos } from './produtos';
import { apagarCarrinhos } from './carrinho';

// Endereço da API: por omissão a Toolshop local; pode ser trocado
// com a variável de ambiente API_URL.
const API_URL = process.env.API_URL ?? 'http://localhost:8091';

Before(async function (this: MundoToolshop) {
  this.api = await request.newContext({
    baseURL: API_URL,
    // Somos um cliente de API: pedimos sempre JSON. Sem isto, o Laravel trata
    // os erros de validação como um formulário de browser e redireciona.
    extraHTTPHeaders: { Accept: 'application/json' },
  });
});

After(async function (this: MundoToolshop) {
  // Limpeza: apaga o que o cenário criou, antes de fechar o cliente HTTP.
  if (this.api && this.produtosCriados.length > 0) {
    await apagarProdutos(this.api, this.produtosCriados);
  }
  if (this.api && this.carrinhosCriados.length > 0) {
    await apagarCarrinhos(this.api, this.carrinhosCriados);
  }
  await this.api?.dispose();
});