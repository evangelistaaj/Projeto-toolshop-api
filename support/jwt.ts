import { createHmac } from 'node:crypto';

// Um token JWT tem 3 partes, separadas por pontos: cabeçalho.conteúdo.assinatura.
// O cabeçalho e o conteúdo são JSON em base64url; qualquer pessoa os consegue ler.
// A assinatura é que prova que foi a Toolshop a emitir o token, com o seu segredo.

type Partes = { cabecalho: Record<string, unknown>; conteudo: Record<string, unknown>; assinatura: string };

const paraBase64 = (objeto: unknown) => Buffer.from(JSON.stringify(objeto)).toString('base64url');
const deBase64 = (texto: string) => JSON.parse(Buffer.from(texto, 'base64url').toString('utf8'));

export function lerToken(token: string): Partes {
  const [cabecalho, conteudo, assinatura] = token.split('.');
  return { cabecalho: deBase64(cabecalho), conteudo: deBase64(conteudo), assinatura };
}

// Altera o conteúdo e mantém a assinatura original: é o que faria alguém que
// apanhasse um token e quisesse dar-se mais permissões, sem conhecer o segredo.
export function tokenAlterado(token: string, alteracoes: Record<string, unknown>): string {
  const { cabecalho, conteudo, assinatura } = lerToken(token);
  return `${paraBase64(cabecalho)}.${paraBase64({ ...conteudo, ...alteracoes })}.${assinatura}`;
}

// O ataque "alg: none": declara que o token não tem assinatura e retira-a.
// Uma biblioteca mal configurada aceitaria um token assim sem verificar nada.
export function tokenSemAssinatura(token: string): string {
  const { cabecalho, conteudo } = lerToken(token);
  return `${paraBase64({ ...cabecalho, alg: 'none' })}.${paraBase64(conteudo)}.`;
}

// Assina de novo, com o segredo verdadeiro (HS256), um token com o conteúdo alterado.
// Serve para criar um token legítimo noutro momento do tempo (ex.: já expirado),
// sem esperar que o tempo passe. Só na Toolshop local, onde temos o segredo.
export function tokenAssinado(token: string, alteracoes: Record<string, unknown>, segredo: string): string {
  const { cabecalho, conteudo } = lerToken(token);
  const semAssinatura = `${paraBase64(cabecalho)}.${paraBase64({ ...conteudo, ...alteracoes })}`;
  const assinatura = createHmac('sha256', segredo).update(semAssinatura).digest('base64url');
  return `${semAssinatura}.${assinatura}`;
}
