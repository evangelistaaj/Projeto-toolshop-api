import { When, Then } from '@cucumber/cucumber';
import type { MundoToolshop } from '../support/world';

When('consulto o catálogo de produtos', async function (this: MundoToolshop) {
  this.resposta = await this.api.get('/products');
});

Then('recebo uma lista de produtos', function (this: MundoToolshop) {
  return 'pending';
});