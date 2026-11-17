import { When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import type { MundoToolshop } from '../support/world';
import { corpoSeguro } from '../support/seguranca';
import { PROVINCIAS_ARGENTINA, normalizar } from '../support/referencia';

When('pesquiso a morada do código postal {string} em {string}',
    async function (this: MundoToolshop, codigoPostal: string, pais: string) {
        this.codigoPostalPesquisado = codigoPostal;
        this.resposta = await this.api.get('/postcode-lookup', {
            // O número da porta é opcional. Sem ele, a API inventa um ao acaso,
            // e o teste deixava de ser repetível.
            params: { country: pais, postcode: codigoPostal, house_number: '1' },
        });
    },
);

Then('recebo uma morada completa em {string}',
    async function (this: MundoToolshop, pais: string) {
        if (!this.resposta) {
            throw new Error('Este passo precisa de um "Quando" que pesquise uma morada antes.');
        }

        // 1. Código HTTP. Fonte: Swagger (200).
        expect(this.resposta.status(), await corpoSeguro(this.resposta)).toBe(200);

        const morada = await this.resposta.json();

        // 2. Rua, cidade e distrito preenchidos (um texto só com espaços também conta como vazio).
        for (const campo of ['street', 'city', 'state']) {
            expect(String(morada[campo] ?? '').trim(), `o campo "${campo}" deve vir preenchido`).not.toBe('');
        }

        // 3. O país e o código postal são os que pesquisámos.
        expect(morada.country, 'país da morada').toBe(pais);
        expect(morada.postcode, 'código postal da morada').toBe(this.codigoPostalPesquisado);
    });

Then('o distrito da morada é uma província da Argentina',
    async function (this: MundoToolshop) {
        if (!this.resposta) {
            throw new Error('Este passo precisa de um "Quando" que pesquise uma morada antes.');
        }
        expect(this.resposta.status(), await corpoSeguro(this.resposta)).toBe(200);

        const morada = await this.resposta.json();
        const provincias = PROVINCIAS_ARGENTINA.map(normalizar);
        expect(
            provincias,
            `o distrito "${morada.state}" deve ser uma província argentina`,
        ).toContain(normalizar(String(morada.state ?? '')));
    });