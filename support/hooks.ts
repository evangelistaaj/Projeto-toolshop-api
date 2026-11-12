import { Before, After } from '@cucumber/cucumber';
import { request } from '@playwright/test';
import type { MundoToolshop } from './world';

// Endereço da API: por omissão a Toolshop local; pode ser trocado
// com a variável de ambiente API_URL.
const API_URL = process.env.API_URL ?? 'http://localhost:8091';

Before(async function (this: MundoToolshop) {
    this.api = await request.newContext({ baseURL: API_URL });
});

After(async function (this: MundoToolshop) {
    await this.api?.dispose();
});