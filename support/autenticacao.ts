import type { MundoToolshop } from './world';

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