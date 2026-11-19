import { Given, When, Then, DataTable } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import type { MundoToolshop } from '../support/world';
import { cabecalhosDeAutenticacao, tokenDeAdministrador } from '../support/autenticacao';
import { dadosDeProdutoValidos, type DadosProduto } from '../support/produtos';
import { codigoDoPais } from '../support/referencia';
import { corpoSeguro } from '../support/seguranca';
import { comprarCarrinho, moradaIndicada } from '../support/faturas';

// ---------- Preparação: produto, carrinho e morada ----------

// Cria, como administrador, um produto só para o cenário, com stock conhecido.
// Outros campos (preço, classificação CO2...) podem ser indicados pelo cenário.
async function criarProdutoParaOCenario(
    mundo: MundoToolshop,
    stock: number,
    alteracoes: Partial<DadosProduto> = {},
) {
    const token = await tokenDeAdministrador(mundo.api);
    mundo.dadosEnviados = await dadosDeProdutoValidos(mundo.api, { ...alteracoes, stock });
    const criacao = await mundo.api.post('/products', {
        data: mundo.dadosEnviados,
        headers: { Authorization: `Bearer ${token}` },
    });
    expect(criacao.status(), await corpoSeguro(criacao)).toBe(201);
    mundo.produtoId = (await criacao.json()).id;
    mundo.produtosCriados.push(mundo.produtoId!);

    // O produto tem de começar disponível: sem isto, "fica esgotado" passaria sem provar nada.
    const consulta = await mundo.api.get(`/products/${mundo.produtoId}`);
    expect((await consulta.json()).in_stock, 'o produto acabado de criar devia estar disponível').toBe(stock > 0);
}

// Cria um carrinho novo com o produto do cenário, na quantidade pedida.
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

// Morada sugerida pela pesquisa do código postal, já no formato da fatura.
// O distrito vem como a pesquisa o devolve (vazio para Portugal, ver issue #2).
async function moradaSugeridaParaFatura(mundo: MundoToolshop, codigoPostal: string, pais: string) {
    const pesquisa = await mundo.api.get('/postcode-lookup', {
        params: { country: pais, postcode: codigoPostal, house_number: '1' },
    });
    expect(pesquisa.status(), await corpoSeguro(pesquisa)).toBe(200);
    const sugerida = await pesquisa.json();
    return {
        billing_street: `${sugerida.street} ${sugerida.house_number}`,
        billing_city: sugerida.city,
        billing_state: sugerida.state ?? '',
        billing_country: pais,
        billing_postal_code: codigoPostal,
    };
}

Given('que tenho no carrinho a quantidade {int} de um produto com stock {int}',
    async function (this: MundoToolshop, quantidade: number, stock: number) {
        await criarProdutoParaOCenario(this, stock);
        await novoCarrinhoCom(this, quantidade);
    });

// Um carrinho com vários produtos, um por linha da tabela (quantidade | preço | CO2).
// Cada produto é criado só para o cenário, com stock suficiente para a quantidade.
Given('que tenho no carrinho os produtos:', async function (this: MundoToolshop, tabela: DataTable) {
    this.produtosNoCarrinho = [];
    for (const linha of tabela.hashes()) {
        const quantidade = Number(linha['quantidade']);
        const preco = Number(linha['preço']);
        const co2 = linha['CO2'];
        await criarProdutoParaOCenario(this, quantidade + 5, { price: preco, co2_rating: co2 });
        this.produtosNoCarrinho.push({ id: this.produtoId!, nome: this.dadosEnviados!.name, preco, quantidade, co2 });
    }

    const carrinho = await this.api.post('/carts');
    expect(carrinho.status(), await corpoSeguro(carrinho)).toBe(201);
    this.carrinhoId = (await carrinho.json()).id;
    this.carrinhosCriados.push(this.carrinhoId!);

    for (const produto of this.produtosNoCarrinho) {
        const juntar = await this.api.post(`/carts/${this.carrinhoId}`, {
            data: { product_id: produto.id, quantity: produto.quantidade },
        });
        expect(juntar.status(), await corpoSeguro(juntar)).toBe(200);
    }
});

Given('que indico a morada sugerida para o código postal {string} de {string}',
    async function (this: MundoToolshop, codigoPostal: string, pais: string) {
        this.moradaDaFatura = await moradaSugeridaParaFatura(this, codigoPostal, codigoDoPais(pais));
    });

Given('que troco a cidade por {string}', function (this: MundoToolshop, cidade: string) {
    moradaIndicada(this).billing_city = cidade;
});

Given('que indico o distrito {string}', function (this: MundoToolshop, distrito: string) {
    moradaIndicada(this).billing_state = distrito;
});

Given('que deixo o distrito em branco', function (this: MundoToolshop) {
    moradaIndicada(this).billing_state = '';
});

// ---------- Ação ----------

When('finalizo a compra', async function (this: MundoToolshop) {
    await comprarCarrinho(this, moradaIndicada(this));
});

// ---------- Compra aceite ----------

Then('a fatura é criada com os produtos do carrinho', async function (this: MundoToolshop) {
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
    expect(fatura.subtotal, 'subtotal = preço × quantidade').toBeCloseTo(
        this.dadosEnviados.price * this.quantidadeNoCarrinho!, 2,);
});

// ---------- Compra recusada ----------

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

Then('a compra é recusada', async function (this: MundoToolshop) {
    await erroDaCompra(this);
    expect(this.faturaId, 'não deve ser criada nenhuma fatura').toBeUndefined();
});

Then('o erro da compra aponta para a cidade', async function (this: MundoToolshop) {
    const campos = Object.keys(errosPorCampo(await erroDaCompra(this)));
    expect(campos, `o erro devia estar no campo "billing_city"; veio em: ${campos.join(', ')}`).toContain('billing_city');
});

Then('a mensagem de erro da compra refere o código postal', async function (this: MundoToolshop) {
    const mensagens = Object.values(errosPorCampo(await erroDaCompra(this))).flat().join(' ');
    expect(mensagens, 'a mensagem deve referir o código postal').toMatch(/postal|postcode|zip/i);
});

Then('a mensagem de erro da compra diz que o distrito é obrigatório', async function (this: MundoToolshop) {
    const erros = errosPorCampo(await erroDaCompra(this));
    expect(Object.keys(erros), 'o erro deve estar no campo "billing_state"').toContain('billing_state');
    expect(erros.billing_state.join(' '), 'a mensagem deve dizer que o distrito é obrigatório').toMatch(
        /required|obrigat/i,
    );
});

Then('o erro da compra segue o formato de erros da API', async function (this: MundoToolshop) {
    const corpo = await erroDaCompra(this);
    expect(corpo, 'formato esperado: {"message": ..., "errors": {...}}').toEqual(
        expect.objectContaining({ message: expect.any(String), errors: expect.any(Object) }),
    );
});

// ---------- Numeração das faturas ----------

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
    await criarProdutoParaOCenario(this, 5);
    this.numerosDasFaturas = [];
    for (let compra = 1; compra <= 2; compra++) {
        await novoCarrinhoCom(this, 1);
        const morada = await moradaSugeridaParaFatura(this, '1000-001', 'PT');
        await comprarCarrinho(this, { ...morada, billing_state: 'Lisboa' });
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

// ---------- Stock ----------

// Disponibilidade real do produto, lida sem cache. O GET /products/{id} guarda a
// resposta em cache durante 5 minutos (ProductService::CACHE_TTL, na Toolshop), e a
// cache não é limpa quando a fila desconta o stock. O carrinho da compra, que
// continua a existir depois dela, carrega o produto diretamente da base de dados.
async function disponibilidadeReal(mundo: MundoToolshop): Promise<boolean> {
    const consulta = await mundo.api.get(`/carts/${mundo.carrinhoId}`);
    expect(consulta.status(), await corpoSeguro(consulta)).toBe(200);
    const linha = (await consulta.json()).cart_items.find(
        (l: { product_id: string }) => l.product_id === mundo.produtoId,
    );
    if (!linha) {
        throw new Error('O produto já não está no carrinho da compra: não há onde ler o stock real.');
    }
    return linha.product.in_stock;
}

Then('o produto fica esgotado', { timeout: 120_000 }, async function (this: MundoToolshop) {
    // A compra tem de ter sido aceite; senão, nada foi descontado.
    expect(this.resposta!.status(), await corpoSeguro(this.resposta!)).toBe(201);

    // O stock é descontado pelo agendador (uma vez por minuto): repetimos a
    // verificação até o resultado aparecer, sem esperas fixas.
    await expect
        .poll(() => disponibilidadeReal(this), {
            message: 'o produto devia ficar esgotado até 90 s depois da compra',
            timeout: 90_000,
            intervals: [5_000],
        })
        .toBe(false);
});

Then('o catálogo mostra o produto esgotado', async function (this: MundoToolshop) {
    // O passo anterior garantiu que o stock real já acabou: o catálogo tem de concordar.
    const consulta = await this.api.get(`/products/${this.produtoId}`);
    expect(consulta.status(), await corpoSeguro(consulta)).toBe(200);
    expect((await consulta.json()).in_stock, 'o catálogo devia mostrar o produto esgotado, como o stock real').toBe(false);
});

Given('que existe um produto com stock {int}', async function (this: MundoToolshop, stock: number) {
    await criarProdutoParaOCenario(this, stock);
});

When('junto esse produto a um carrinho novo', async function (this: MundoToolshop) {
    const carrinho = await this.api.post('/carts');
    expect(carrinho.status(), await corpoSeguro(carrinho)).toBe(201);
    this.carrinhoId = (await carrinho.json()).id;
    this.carrinhosCriados.push(this.carrinhoId!);

    this.resposta = await this.api.post(`/carts/${this.carrinhoId}`, {
        data: { product_id: this.produtoId, quantity: 1 },
    });
});

Then('o produto não é aceite no carrinho', async function (this: MundoToolshop) {
    // Fonte: o Swagger documenta 422 para o POST /carts/{id}, como nos outros erros de validação.
    expect(this.resposta!.status(), await corpoSeguro(this.resposta!)).toBe(422);

    const consulta = await this.api.get(`/carts/${this.carrinhoId}`);
    expect((await consulta.json()).cart_items, 'o carrinho devia continuar vazio').toEqual([]);
});