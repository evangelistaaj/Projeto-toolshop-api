import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import type { MundoToolshop } from '../support/world';
import { cabecalhosDeAutenticacao, tokenDeAdministrador } from '../support/autenticacao';
import { dadosDeProdutoValidos } from '../support/produtos';
import { corpoSeguro } from '../support/seguranca';

Given('que tenho no carrinho a quantidade {int} de um produto de teste com stock {int}',
    async function (this: MundoToolshop, quantidade: number, stock: number) {
        // 1. O administrador cria um produto só para este cenário, com stock conhecido.
        const token = await tokenDeAdministrador(this.api);
        this.dadosEnviados = await dadosDeProdutoValidos(this.api, { stock });
        const criacao = await this.api.post('/products', {
            data: this.dadosEnviados,
            headers: { Authorization: `Bearer ${token}` },
        });
        expect(criacao.status(), await corpoSeguro(criacao)).toBe(201);
        this.produtoId = (await criacao.json()).id;
        this.produtosCriados.push(this.produtoId!);

        // 2. Um carrinho novo, com esse produto na quantidade pedida.
        const carrinho = await this.api.post('/carts');
        expect(carrinho.status(), await corpoSeguro(carrinho)).toBe(201);
        this.carrinhoId = (await carrinho.json()).id;
        this.carrinhosCriados.push(this.carrinhoId!);

        const juntar = await this.api.post(`/carts/${this.carrinhoId}`, {
            data: { product_id: this.produtoId, quantity: quantidade },
        });
        expect(juntar.status(), await corpoSeguro(juntar)).toBe(200);
        this.quantidadeNoCarrinho = quantidade;
    },
);

When('compro o carrinho com a morada sugerida para {string} em {string} e o distrito {string}',
    async function (this: MundoToolshop, codigoPostal: string, pais: string, distrito: string) {
        if (!this.carrinhoId) {
            throw new Error('Este passo precisa de um carrinho com produtos antes.');
        }

        // A rua e a cidade vêm da pesquisa do código postal, como na interface.
        const pesquisa = await this.api.get('/postcode-lookup', {
            params: { country: pais, postcode: codigoPostal, house_number: '1' },
        });
        expect(pesquisa.status(), await corpoSeguro(pesquisa)).toBe(200);
        const sugerida = await pesquisa.json();

        this.moradaDaFatura = {
            billing_street: `${sugerida.street} ${sugerida.house_number}`,
            billing_city: sugerida.city,
            billing_state: distrito,
            billing_country: pais,
            billing_postal_code: codigoPostal,
        };

        this.resposta = await this.api.post('/invoices', {
            headers: cabecalhosDeAutenticacao(this),
            data: {
                ...this.moradaDaFatura,
                // Pagamento na entrega: não precisa de detalhes, e o pagamento não é o que estamos a testar.
                payment_method: 'cash-on-delivery',
                payment_details: {},
                cart_id: this.carrinhoId,
            },
        });
        if (this.resposta.ok()) {
            this.faturaId = (await this.resposta.json()).id;
        }
    },
);

Then('a fatura é criada com os produtos do carrinho',
    async function (this: MundoToolshop) {
        if (!this.resposta || !this.moradaDaFatura || !this.dadosEnviados) {
            throw new Error('Este passo precisa de uma compra antes.');
        }

        // 1. Código HTTP. Fonte: convenção REST (201 Created); o Swagger documenta 200.
        expect(this.resposta.status(), await corpoSeguro(this.resposta)).toBe(201);
        const criada = await this.resposta.json();
        expect(this.faturaId, 'a criação deve devolver o id da fatura').toEqual(expect.any(String));
        expect(criada.invoice_number, 'formato do número da fatura').toMatch(/^INV-\d+$/);

        // 2. A fatura existe mesmo: consultamo-la à parte, como cliente.
        const consulta = await this.api.get(`/invoices/${this.faturaId}`, {
            headers: cabecalhosDeAutenticacao(this),
        });
        expect(consulta.status(), await corpoSeguro(consulta)).toBe(200);
        const fatura = await consulta.json();

        // 3. Tem a morada que enviámos...
        expect(fatura).toEqual(expect.objectContaining(this.moradaDaFatura));

        // ...e o produto do carrinho, na quantidade e ao preço certos.
        expect(fatura.invoicelines, 'a fatura deve ter uma linha por produto').toHaveLength(1);
        const linha = fatura.invoicelines[0];
        expect(linha.product_id, 'produto da linha').toBe(this.produtoId);
        expect(linha.quantity, 'quantidade da linha').toBe(this.quantidadeNoCarrinho);
        expect(linha.unit_price, 'preço unitário').toBe(this.dadosEnviados.price);
        expect(fatura.subtotal, 'subtotal = preço × quantidade').toBeCloseTo(this.dadosEnviados.price * this.quantidadeNoCarrinho!, 2);
    });