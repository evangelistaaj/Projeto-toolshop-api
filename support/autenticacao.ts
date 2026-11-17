import type { MundoToolshop } from './world';
import type { APIRequestContext } from '@playwright/test';
import { contaAdmin } from './contas';

// Faz o pedido de login e, se correr bem, guarda o token no World.
// Partilhada por todos os passos que precisam de uma sessão iniciada.
export async function fazerLogin(mundo: MundoToolshop, email: string, password: string) {
  mundo.resposta = await mundo.api.post('/users/login', { data: { email, password } });
  if (mundo.resposta.ok()) {
    const corpo = await mundo.resposta.json();
    mundo.token = corpo.access_token;
    mundo.emailLogin = email;
  }
}

// Cabeçalhos de um pedido: com token, se houver sessão; vazios, se não houver.
export function cabecalhosDeAutenticacao(mundo: MundoToolshop): Record<string, string> {
  return mundo.token ? { Authorization: `Bearer ${mundo.token}` } : {};
}

// Token de administrador, sem mexer na sessão do cenário (que pode ser de um cliente).
export async function tokenDeAdministrador(api: APIRequestContext): Promise<string> {
  const resposta = await api.post('/users/login', { data: contaAdmin });
  if (!resposta.ok()) {
    throw new Error(`O login do administrador falhou (HTTP ${resposta.status()})`);
  }
  return (await resposta.json()).access_token;
}