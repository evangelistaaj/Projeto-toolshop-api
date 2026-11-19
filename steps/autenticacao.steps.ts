import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import type { MundoToolshop } from '../support/world';
import { contaCliente, contaAdmin } from '../support/contas';
import { fazerLogin } from '../support/autenticacao';
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