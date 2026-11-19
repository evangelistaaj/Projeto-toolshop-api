import type { APIRequestContext } from '@playwright/test';
import { contaAdmin } from './contas';
import { lerDados } from './dados';
import { normalizar } from './referencia';

// Nomes de clientes da massa de teste (dados/clientes.json).
const CLIENTES = lerDados<{ nome: string; apelido: string }[]>('clientes.json');

export type DadosCliente = {
  first_name: string;
  last_name: string;
  dob?: string;
  phone: string;
  email: string;
  password: string;
  address: { street: string; house_number: string; city: string; state: string; country: string; postal_code: string };
  [campo: string]: unknown;
};

function aoAcaso(tamanho: number): string {
  return Math.random().toString(36).slice(2, 2 + tamanho);
}

// Data AAAA-MM-DD, calculada em UTC (o fuso da API), a partir de hoje.
function dataUtc(anos: number, dias = 0): string {
  const hoje = new Date();
  const data = new Date(Date.UTC(hoje.getUTCFullYear() - anos, hoje.getUTCMonth(), hoje.getUTCDate() + dias));
  return data.toISOString().slice(0, 10);
}

// Data de nascimento de quem faz ou fez N anos num dia relativo a hoje:
// "faz 18 anos hoje", "fez 18 anos ontem", "faz 18 anos amanhã".
// Assim os cenários de idade nunca caducam. (Num 29 de fevereiro, a conta pode diferir
// da do servidor num dia: a data de há N anos pode não existir.)
export function dataDeNascimento(texto: string): string {
  const partes = texto.match(/^(faz|fez) (\d+) anos (hoje|ontem|amanhã)$/);
  if (!partes) {
    throw new Error(`Idade "${texto}" não reconhecida. Use, por exemplo, "faz 18 anos hoje" ou "fez 18 anos ontem".`);
  }
  const dias = { hoje: 0, ontem: -1, 'amanhã': 1 }[partes[3] as 'hoje' | 'ontem' | 'amanhã'];
  return dataUtc(Number(partes[2]), dias);
}

// Uma password aleatória que cumpre as regras da Toolshop (8+ caracteres, maiúsculas,
// minúsculas, algarismos e símbolos) e que, por ser aleatória, não consta de fugas de dados.
export function passwordValida(): string {
  return `Ts#${aoAcaso(6)}${Math.floor(Math.random() * 90 + 10)}Lx!${aoAcaso(4)}`;
}

// Dados válidos para registar um cliente: nome da massa de teste, email único num
// domínio reservado para exemplos (example.com), 30 anos de idade e morada em Lisboa.
export function dadosDeClienteValidos(): DadosCliente {
  const { nome, apelido } = CLIENTES[Math.floor(Math.random() * CLIENTES.length)];
  const email = `${normalizar(nome)}.${normalizar(apelido)}.${Date.now().toString(36)}${aoAcaso(3)}@example.com`;
  return {
    first_name: nome,
    last_name: apelido,
    dob: dataUtc(30),
    phone: '912345678',
    email,
    password: passwordValida(),
    address: {
      street: 'Rua Augusta',
      house_number: '10',
      city: 'Lisboa',
      state: 'Lisboa',
      country: 'PT',
      postal_code: '1100-048',
    },
  };
}

// Nome de cada campo do registo no Gherkin → caminho do campo na API.
const CAMPOS: Record<string, string> = {
  email: 'email',
  password: 'password',
  'data de nascimento': 'dob',
  'código postal': 'address.postal_code',
};

export function campoDoRegisto(nome: string): string {
  const campo = CAMPOS[nome];
  if (!campo) {
    throw new Error(`Campo de registo "${nome}" desconhecido. Campos conhecidos: ${Object.keys(CAMPOS).join(', ')}.`);
  }
  return campo;
}

// Altera um campo dos dados (incluindo os da morada, como "address.postal_code").
export function comCampo(dados: DadosCliente, caminho: string, valor: unknown): DadosCliente {
  const copia = structuredClone(dados);
  const [primeiro, segundo] = caminho.split('.');
  if (segundo) {
    (copia[primeiro] as Record<string, unknown>)[segundo] = valor;
  } else {
    copia[primeiro] = valor;
  }
  return copia;
}

// Limpeza: apaga as contas registadas num cenário (só o administrador o pode fazer).
export async function apagarClientes(api: APIRequestContext, ids: string[]) {
  const login = await api.post('/users/login', { data: contaAdmin });
  const { access_token } = await login.json();
  for (const id of ids) {
    const resposta = await api.delete(`/users/${id}`, { headers: { Authorization: `Bearer ${access_token}` } });
    if (![204, 404].includes(resposta.status())) {
      console.warn(`Limpeza: não foi possível apagar o cliente ${id} (HTTP ${resposta.status()})`);
    }
  }
}
