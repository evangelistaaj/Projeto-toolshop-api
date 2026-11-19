import { Before, After, BeforeAll, setDefaultTimeout } from '@cucumber/cucumber';
import { request } from '@playwright/test';
import type { MundoToolshop } from './world';
import { apagarProdutos } from './produtos';
import { apagarCarrinhos } from './carrinho';

// Endereço da API: por omissão a Toolshop local; pode ser trocado
// com a variável de ambiente API_URL.
const API_URL = process.env.API_URL ?? 'http://localhost:8091';

// Tempo máximo de cada passo (o Cucumber usa 5 s por omissão). Numa máquina de
// integração contínua os pedidos são mais lentos, e um passo de 5,1 s falharia
// sem haver bug. Os passos que esperam por processos em segundo plano têm o seu limite.
setDefaultTimeout(15_000);

// Antes de tudo, confirma que a API responde. Sem isto, com a Toolshop desligada,
// cada cenário falhava com um erro de ligação difícil de ler.
BeforeAll(async function () {
  const api = await request.newContext({ baseURL: API_URL, extraHTTPHeaders: { Accept: 'application/json' } });
  try {
    const resposta = await api.get('/products', { timeout: 10_000 });
    if (!resposta.ok()) {
      throw new Error(`HTTP ${resposta.status()}`);
    }
  } catch (erro) {
    throw new Error(
      `A API da Toolshop não responde em ${API_URL} (${(erro as Error).message}). ` +
        'Está a correr? Ver "Como executar" no README.',
    );
  } finally {
    await api.dispose();
  }
});

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