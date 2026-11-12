import { World, setWorldConstructor } from '@cucumber/cucumber';
import type { APIRequestContext, APIResponse } from '@playwright/test';

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
}

setWorldConstructor(MundoToolshop);