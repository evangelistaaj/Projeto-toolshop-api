import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import type { MundoToolshop } from '../support/world';
import { contaCliente, contaAdmin } from '../support/contas';
import { fazerLogin, cabecalhosDeAutenticacao } from '../support/autenticacao';
import { lerToken, tokenAlterado, tokenSemAssinatura, tokenAssinado } from '../support/jwt';
import { segredoJwt } from '../support/toolshop-local';
import { corpoSeguro } from '../support/seguranca';

Given('que fiz login como administrador',
    async function (this: MundoToolshop) {
        await fazerLogin(this, contaAdmin.email, contaAdmin.password);
        expect(this.resposta!.status(), await corpoSeguro(this.resposta!)).toBe(200);
    });

When('faço login como cliente',
    async function (this: MundoToolshop) {
        await fazerLogin(this, contaCliente.email, contaCliente.password);
    });

When('faço login com o email {string} e a password {string}',
    async function (this: MundoToolshop, email: string, password: string) {
        await fazerLogin(this, email, password);
    },
);

Then('recebo um token de acesso válido',
    async function (this: MundoToolshop) {
        if (!this.resposta) {
            throw new Error('Este passo precisa de um "Quando" que faça login antes.');
        }

        // 1. Código HTTP
        expect(this.resposta.status(), await corpoSeguro(this.resposta)).toBe(200);

        // 2. e 3. Forma e valores do token
        const corpo = await this.resposta.json();
        expect(corpo.access_token, 'access_token deve ser texto').toEqual(expect.any(String));
        expect(corpo.access_token.length, 'access_token não deve vir vazio').toBeGreaterThan(0);

        // A norma HTTP não distingue maiúsculas no esquema: "Bearer" = "bearer".
        expect(String(corpo.token_type).toLowerCase(), 'token_type').toBe('bearer');

        // Não exigimos 300 exatos: não está documentado e pode mudar sem ser defeito.
        expect(corpo.expires_in, 'expires_in deve ser numérico').toEqual(expect.any(Number));
        expect(corpo.expires_in, 'expires_in deve ser positivo').toBeGreaterThan(0);
    });


Given('que fiz login como cliente',
    async function (this: MundoToolshop) {
        await fazerLogin(this, contaCliente.email, contaCliente.password);
        // É uma pré-condição: se o login falhar, o cenário pára aqui, com a causa.
        expect(this.resposta!.status(), await corpoSeguro(this.resposta!)).toBe(200);
    });

When('consulto os dados da minha conta',
    async function (this: MundoToolshop) {
        // Com token, envia-o; sem token (cenário sem login), o pedido vai sem cabeçalho.
        const headers: Record<string, string> = this.token ? { Authorization: `Bearer ${this.token}` } : {};
        this.resposta = await this.api.get('/users/me', { headers });
    });

Then('vejo os dados da conta com que fiz login',
    async function (this: MundoToolshop) {
        if (!this.resposta || !this.emailLogin) {
            throw new Error('Este passo precisa de um login e de uma consulta à conta antes.');
        }

        // 1. Código HTTP
        expect(this.resposta.status(), await corpoSeguro(this.resposta)).toBe(200);

        // 2. Forma: os campos essenciais de uma conta
        const conta = await this.resposta.json();
        expect(conta).toEqual(
            expect.objectContaining({
                id: expect.any(String),
                first_name: expect.any(String),
                last_name: expect.any(String),
                email: expect.any(String),
            }),
        );

        // Segurança: a API nunca deve devolver a password, nem cifrada.
        expect(conta, 'a resposta não deve incluir a password').not.toHaveProperty('password');

        // 3. Valores: é a conta com que fiz login, e não outra
        expect(conta.email, 'a conta devolvida deve ser a do login').toBe(this.emailLogin);
    });

// ---------- Tokens que não deviam servir ----------

function tokenDoCenario(mundo: MundoToolshop): string {
    if (!mundo.token) {
        throw new Error('Este passo precisa de um token. Falta o passo "Dado que fiz login como cliente"?');
    }
    return mundo.token;
}

Given('que tenho o token {string}',
    async function (this: MundoToolshop, token: string) {
        this.token = token;
    });

Given('que alterei o meu token para ter o perfil de administrador',
    async function (this: MundoToolshop) {
        const token = tokenDoCenario(this);
        // Ponto de partida: um token verdadeiro de cliente. Sem isto, o cenário não provava nada.
        expect(lerToken(token).conteudo.role, 'o token original devia ser de cliente').toBe('user');
        this.token = tokenAlterado(token, { role: 'admin' });
    });

Given('que retirei a assinatura do meu token',
    async function (this: MundoToolshop) {
        this.token = tokenSemAssinatura(tokenDoCenario(this));
    });

// Um token verdadeiro da conta, assinado com o segredo da Toolshop local, mas noutro
// momento do tempo: assim não é preciso esperar 5 minutos para ele expirar. O exemplo
// "ainda válido" prova que o token assim criado é aceite, e que a recusa do expirado
// vem mesmo da validade e não da assinatura.
Given(/^que tenho um token da minha conta que (expirou há|expira daqui a) (\d+) minutos?$/,
    async function (this: MundoToolshop, quando: string, minutos: string) {
        await fazerLogin(this, contaCliente.email, contaCliente.password);
        expect(this.resposta!.status(), await corpoSeguro(this.resposta!)).toBe(200);

        const agora = Math.floor(Date.now() / 1000);
        const segundos = Number(minutos) * 60;
        const expira = quando === 'expirou há' ? agora - segundos : agora + segundos;
        // Emitido 5 minutos antes de expirar, como os tokens da Toolshop (ttl de 5 minutos).
        const emitido = Math.min(expira - 300, agora);
        this.token = tokenAssinado(this.token!, { iat: emitido, nbf: emitido, exp: expira }, segredoJwt());
    });

Given('que terminei a sessão',
    async function (this: MundoToolshop) {
        const resposta = await this.api.get('/users/logout', { headers: cabecalhosDeAutenticacao(this) });
        expect(resposta.status(), await corpoSeguro(resposta)).toBe(200);
        // O token continua guardado no cenário: é ele que vamos tentar usar a seguir.
    });

When('consulto a lista de clientes',
    async function (this: MundoToolshop) {
        this.resposta = await this.api.get('/users', { headers: cabecalhosDeAutenticacao(this) });
    });
