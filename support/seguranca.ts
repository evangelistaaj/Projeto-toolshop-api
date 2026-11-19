import type { APIResponse } from '@playwright/test';

// Campos que nunca devem aparecer em mensagens de falha nem em relatórios.
// Num sistema real juntavam-se aqui os dados pessoais (email, telefone, morada...).
const CAMPOS_SENSIVEIS = ['access_token', 'password', 'cvv', 'credit_card_number'];

// Devolve o corpo da resposta pronto a mostrar numa mensagem de falha,
// com os campos sensíveis trocados por "***".
export async function corpoSeguro(resposta: APIResponse): Promise<string> {
    const texto = await resposta.text();
    try {
        return JSON.stringify(JSON.parse(texto), (campo, valor) =>
            CAMPOS_SENSIVEIS.includes(campo) ? '***' : valor,
        );
    } catch {
        return texto; // não é JSON (ex.: uma página de erro em HTML): mostra como veio
    }
}