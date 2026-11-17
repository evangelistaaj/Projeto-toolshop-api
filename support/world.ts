import { World, setWorldConstructor } from '@cucumber/cucumber';
import type { APIRequestContext, APIResponse } from '@playwright/test';
import type { DadosProduto } from './produtos';

// O "mundo" de cada cenário: o Cucumber cria um novo por cenário
// e entrega-o aos passos e hooks como `this`.
export class MundoToolshop extends World {
  // Cliente HTTP do Playwright. É criado no hook Before, porque a criação
  // é assíncrona e um construtor não pode esperar por ela.
  api!: APIRequestContext;

  // Última resposta recebida, para os passos "Então" a verificarem.
  resposta?: APIResponse;

  // Token de acesso, guardado depois de um login com sucesso.
  token?: string;

  // Email com que se fez login, para comparar com os dados da conta.
  emailLogin?: string;

  // Dados enviados na criação de um produto, para comparar com o que fica gravado.
  dadosEnviados?: DadosProduto;

  // Id do último produto criado no cenário.
  produtoId?: string;

  // Todos os produtos criados no cenário, para o hook After os apagar.
  produtosCriados: string[] = [];

  // Carrinho do cenário e o produto que lá foi posto.
  carrinhoId?: string;
  produtoNoCarrinhoId?: string;

  // Todos os carrinhos criados no cenário, para o hook After os apagar.
  carrinhosCriados: string[] = [];

}

setWorldConstructor(MundoToolshop);