import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import type { MundoToolshop } from '../support/world';
import { cabecalhosDeAutenticacao, tokenDeAdministrador } from '../support/autenticacao';
import { dadosDeProdutoValidos } from '../support/produtos';
import { corpoSeguro } from '../support/seguranca';

// Pesquisa a morada sugerida para um código postal, como a interface faz.
async function moradaSugerida(mundo: MundoToolshop, codigoPostal: string, pais: string) {
    const pesquisa = await mundo.api.get('/postcode-lookup', {
        params: { country: pais, postcode: codigoPostal, house_number: '1' },
    });
    expect(pesquisa.status(), await corpoSeguro(pesquisa)).toBe(200);
    return pesquisa.json();
}

// Compra o carrinho do cenário com a morada indicada.
async function comprarCarrinho(mundo: MundoToolshop, morada: Record<string, string>) {
    if (!mundo.carrinhoId) {
        throw new Error('Este passo precisa de um carrinho com produtos antes.');
    }
    mundo.moradaDaFatura = morada;
    mundo.resposta = await mundo.api.post('/invoices', {
        headers: cabecalhosDeAutenticacao(mundo),
        data: {
            ...morada,
            // Pagamento na entrega: não precisa de detalhes, e o pagamento não é o que estamos a testar.
            payment_method: 'cash-on-delivery',
            payment_details: {},
            cart_id: mundo.carrinhoId,
        },
    });
    if (mundo.resposta.ok()) {
        mundo.faturaId = (await mundo.resposta.json()).id;
    }
}

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
        const sugerida = await moradaSugerida(this, codigoPostal, pais);
        await comprarCarrinho(this, {
            billing_street: `${sugerida.street} ${sugerida.house_number}`,
            billing_city: sugerida.city,
            billing_state: distrito,
            billing_country: pais,
            billing_postal_code: codigoPostal,
        });
    },
);

When('compro o carrinho com o código postal {string} em {string}, a cidade {string} e o distrito {string}',
    async function (this: MundoToolshop, codigoPostal: string, pais: string, cidade: string, distrito: string) {
        // A rua continua a ser a sugerida; só a cidade é a indicada no cenário.
        const sugerida = await moradaSugerida(this, codigoPostal, pais);
        await comprarCarrinho(this, {
            billing_street: `${sugerida.street} ${sugerida.house_number}`,
            billing_city: cidade,
            billing_state: distrito,
            billing_country: pais,
            billing_postal_code: codigoPostal,
        });
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

// Corpo de uma compra recusada. Confirma primeiro que foi mesmo recusada:
// se a compra tivesse sido aceite, verificar o erro não faria sentido.
async function erroDaCompra(mundo: MundoToolshop) {
    if (!mundo.resposta) {
        throw new Error('Este passo precisa de uma compra antes.');
    }
    expect(mundo.resposta.status(), await corpoSeguro(mundo.resposta)).toBe(422);
    return mundo.resposta.json();
}

// Os erros por campo, nos dois formatos que a API usa:
// {"message": ..., "errors": {"campo": [...]}} ou diretamente {"campo": [...]}.
function errosPorCampo(corpo: any): Record<string, string[]> {
    return corpo.errors ?? corpo;
}

Then('a compra é recusada',
    async function (this: MundoToolshop) {
        await erroDaCompra(this);
        expect(this.faturaId, 'não deve ser criada nenhuma fatura').toBeUndefined();
    });

Then('o erro da compra aponta para a cidade',
    async function (this: MundoToolshop) {
        const campos = Object.keys(errosPorCampo(await erroDaCompra(this)));
        expect(campos, `o erro devia estar no campo "billing_city"; veio em: ${campos.join(', ')}`).toContain('billing_city');
    });

Then('a mensagem de erro da compra refere o código postal',
    async function (this: MundoToolshop) {
        const mensagens = Object.values(errosPorCampo(await erroDaCompra(this))).flat().join(' ');
        expect(mensagens, 'a mensagem deve referir o código postal').toMatch(/postal|postcode|zip/i);
    });

Then('o erro da compra segue o formato de erros da API',
    async function (this: MundoToolshop) {
        const corpo = await erroDaCompra(this);
        expect(corpo, 'formato esperado: {"message": ..., "errors": {...}}').toEqual(
            expect.objectContaining({ message: expect.any(String), errors: expect.any(Object) }),
        );
    });

Then('a mensagem de erro da compra diz que o distrito é obrigatório',
    async function (this: MundoToolshop) {
        const erros = errosPorCampo(await erroDaCompra(this));
        expect(Object.keys(erros), 'o erro deve estar no campo "billing_state"').toContain('billing_state');
        expect(
            erros.billing_state.join(' '),
            'a mensagem deve dizer que o distrito é obrigatório',
        ).toMatch(/required|obrigat/i);
    });