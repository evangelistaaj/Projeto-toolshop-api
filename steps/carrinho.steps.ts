import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import type { MundoToolshop } from '../support/world';
import { idDeUmProdutoDoCatalogo } from '../support/carrinho';
import { corpoSeguro } from '../support/seguranca';

// Junta um produto ao carrinho do cenário. Partilhada pelo "Quando" e pelo "Dado".
async function juntarAoCarrinho(mundo: MundoToolshop, produtoId: string, quantidade: number) {
    if (!mundo.carrinhoId) {
        throw new Error('Este passo precisa de um carrinho criado antes ("que tenho um carrinho vazio").');
    }
    mundo.produtoNoCarrinhoId = produtoId;
    mundo.resposta = await mundo.api.post(`/carts/${mundo.carrinhoId}`, {
        data: { product_id: produtoId, quantity: quantidade },
    });
}

// Consulta o carrinho e devolve as linhas (cart_items).
async function linhasDoCarrinho(mundo: MundoToolshop) {
    const consulta = await mundo.api.get(`/carts/${mundo.carrinhoId}`);
    expect(consulta.status(), await corpoSeguro(consulta)).toBe(200);
    const carrinho = await consulta.json();
    expect(Array.isArray(carrinho.cart_items), 'o carrinho deve ter a lista "cart_items"').toBe(true);
    return carrinho.cart_items as { product_id: string; quantity: number }[];
}

Given('que tenho um carrinho vazio',
    async function (this: MundoToolshop) {
        const resposta = await this.api.post('/carts');
        // Fonte: Swagger (201, "CartCreatedResponse").
        expect(resposta.status(), await corpoSeguro(resposta)).toBe(201);
        const corpo = await resposta.json();
        this.carrinhoId = corpo.id;
        this.carrinhosCriados.push(corpo.id);
    });

Given('que o carrinho tem um produto do catálogo com a quantidade {int}',
    async function (this: MundoToolshop, quantidade: number) {
        await juntarAoCarrinho(this, await idDeUmProdutoDoCatalogo(this.api), quantidade);
        expect(this.resposta!.status(), await corpoSeguro(this.resposta!)).toBe(200);
    });

When('junto ao carrinho um produto do catálogo com a quantidade {int}',
    async function (this: MundoToolshop, quantidade: number) {
        await juntarAoCarrinho(this, await idDeUmProdutoDoCatalogo(this.api), quantidade);
    });

When('junto ao carrinho um produto que não existe',
    async function (this: MundoToolshop) {
        // Id com o formato certo (ULID), mas que não existe nos dados.
        // A quantidade é válida (1), para que o único motivo de recusa seja o produto.
        await juntarAoCarrinho(this, '01ZZZZZZZZZZZZZZZZZZZZZZZZ', 1);
    });

When('altero a quantidade desse produto para {int}',
    async function (this: MundoToolshop, quantidade: number) {
        if (!this.carrinhoId || !this.produtoNoCarrinhoId) {
            throw new Error('Este passo precisa de um produto no carrinho antes.');
        }
        this.resposta = await this.api.put(`/carts/${this.carrinhoId}/product/quantity`, {
            data: { product_id: this.produtoNoCarrinhoId, quantity: quantidade },
        });
    });

When('removo esse produto do carrinho',
    async function (this: MundoToolshop) {
        if (!this.carrinhoId || !this.produtoNoCarrinhoId) {
            throw new Error('Este passo precisa de um produto no carrinho antes.');
        }
        this.resposta = await this.api.delete(`/carts/${this.carrinhoId}/product/${this.produtoNoCarrinhoId}`);
    });

Then('o carrinho tem esse produto com a quantidade {int}',
    async function (this: MundoToolshop, quantidade: number) {
        if (!this.resposta || !this.produtoNoCarrinhoId) {
            throw new Error('Este passo precisa de um "Quando" que junte ou altere um produto antes.');
        }
        // Fonte: Swagger (200) para juntar e para alterar a quantidade.
        expect(this.resposta.status(), await corpoSeguro(this.resposta)).toBe(200);

        const linhas = (await linhasDoCarrinho(this)).filter((l) => l.product_id === this.produtoNoCarrinhoId);
        expect(linhas.length, 'o produto deve aparecer numa só linha do carrinho').toBe(1);
        expect(linhas[0].quantity, 'quantidade no carrinho').toBe(quantidade);
    });

Then('o carrinho fica vazio',
    async function (this: MundoToolshop) {
        if (!this.resposta) {
            throw new Error('Este passo precisa de um "Quando" que remova um produto antes.');
        }
        // Fonte: Swagger (204).
        expect(this.resposta.status(),
            await corpoSeguro(this.resposta)).toBe(204);

        const linhas = await linhasDoCarrinho(this);
        expect(linhas, 'o carrinho não deve ter produtos').toEqual([]);
    });