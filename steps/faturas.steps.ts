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

// Monta a morada da fatura a partir da sugerida. A cidade pode ser trocada pelo cenário.
function moradaDaFatura(sugerida: any, codigoPostal: string, pais: string, distrito: string, cidade = sugerida.city) {
    return {
        billing_street: `${sugerida.street} ${sugerida.house_number}`,
        billing_city: cidade,
        billing_state: distrito,
        billing_country: pais,
        billing_postal_code: codigoPostal,
    };
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

// Cria, como administrador, um produto só para o cenário, com stock conhecido.
async function criarProdutoDeTeste(mundo: MundoToolshop, stock: number) {
    const token = await tokenDeAdministrador(mundo.api);
    mundo.dadosEnviados = await dadosDeProdutoValidos(mundo.api, { stock });
    const criacao = await mundo.api.post('/products', {
        data: mundo.dadosEnviados,
        headers: { Authorization: `Bearer ${token}` },
    });
    expect(criacao.status(), await corpoSeguro(criacao)).toBe(201);
    mundo.produtoId = (await criacao.json()).id;
    mundo.produtosCriados.push(mundo.produtoId!);
}

// Cria um carrinho novo com o produto de teste, na quantidade pedida.
async function novoCarrinhoCom(mundo: MundoToolshop, quantidade: number) {
    const carrinho = await mundo.api.post('/carts');
    expect(carrinho.status(), await corpoSeguro(carrinho)).toBe(201);
    mundo.carrinhoId = (await carrinho.json()).id;
    mundo.carrinhosCriados.push(mundo.carrinhoId!);

    const juntar = await mundo.api.post(`/carts/${mundo.carrinhoId}`, {
        data: { product_id: mundo.produtoId, quantity: quantidade },
    });
    expect(juntar.status(), await corpoSeguro(juntar)).toBe(200);
    mundo.quantidadeNoCarrinho = quantidade;
}

Given(
    'que tenho no carrinho a quantidade {int} de um produto de teste com stock {int}',
    async function (this: MundoToolshop, quantidade: number, stock: number) {
        await criarProdutoDeTeste(this, stock);
        await novoCarrinhoCom(this, quantidade);
    },
);

When('compro o carrinho com a morada sugerida para {string} em {string} e o distrito {string}',
    async function (this: MundoToolshop, codigoPostal: string, pais: string, distrito: string) {
        // no "compro o carrinho com a morada sugerida..."
        const sugerida = await moradaSugerida(this, codigoPostal, pais);
        await comprarCarrinho(this, moradaDaFatura(sugerida, codigoPostal, pais, distrito));
    },
);

When('compro o carrinho com o código postal {string} em {string}, a cidade {string} e o distrito {string}',
    async function (this: MundoToolshop, codigoPostal: string, pais: string, cidade: string, distrito: string) {
        // A rua continua a ser a sugerida; só a cidade é a indicada no cenário.
        // no "compro o carrinho com o código postal ..., a cidade ... e o distrito ..."
        const sugerida = await moradaSugerida(this, codigoPostal, pais);
        await comprarCarrinho(this, moradaDaFatura(sugerida, codigoPostal, pais, distrito, cidade));
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

// Número da fatura acabada de criar (confirma primeiro que a compra foi aceite).
async function numeroDaFatura(mundo: MundoToolshop): Promise<string> {
    if (!mundo.resposta) {
        throw new Error('Este passo precisa de uma compra antes.');
    }
    expect(mundo.resposta.status(), await corpoSeguro(mundo.resposta)).toBe(201);
    return (await mundo.resposta.json()).invoice_number;
}

// A sequência de um número de fatura: o que vem depois de "INV-" e do ano.
function sequenciaDe(numero: string): number {
    const partes = numero.match(/^INV-(\d{4})(\d+)$/);
    if (!partes) {
        throw new Error(`Número de fatura com formato inesperado: ${numero}`);
    }
    return Number(partes[2]);
}

When('faço duas compras seguidas', async function (this: MundoToolshop) {
    // Um só produto (com stock para as duas) e um carrinho por compra.
    await criarProdutoDeTeste(this, 5);
    this.numerosDasFaturas = [];
    for (let compra = 1; compra <= 2; compra++) {
        await novoCarrinhoCom(this, 1);
        const sugerida = await moradaSugerida(this, '1000-001', 'PT');
        await comprarCarrinho(this, moradaDaFatura(sugerida, '1000-001', 'PT', 'Lisboa'));
        this.numerosDasFaturas.push(await numeroDaFatura(this));
    }
});

Then('o número da fatura começa pelo ano atual', async function (this: MundoToolshop) {
    const numero = await numeroDaFatura(this);
    const ano = new Date().getFullYear();
    expect(numero, `o número deve começar por INV-${ano}`).toMatch(new RegExp(`^INV-${ano}\\d+$`));
});

Then('os números das duas faturas são consecutivos', async function (this: MundoToolshop) {
    const [primeira, segunda] = this.numerosDasFaturas!.map(sequenciaDe);
    expect(segunda, `faturas: ${this.numerosDasFaturas!.join(' e ')}`).toBe(primeira + 1);
});

Then('o número da fatura tem o formato INV-ano-sequência de {int} algarismos',
    async function (this: MundoToolshop, algarismos: number) {
        const numero = await numeroDaFatura(this);
        expect(numero, `formato esperado: INV-<ano><sequência de ${algarismos} algarismos>`).toMatch(
            new RegExp(`^INV-\\d{4}\\d{${algarismos}}$`),
        );
    },
);