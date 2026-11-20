// Datas relativas a hoje, escritas nos cenários em linguagem de negócio ("faz 18 anos hoje",
// "daqui a 2 anos"), para que os cenários nunca caduquem. As contas são feitas em UTC,
// o fuso da API: assim o teste e o servidor concordam sobre qual é o dia e o mês de hoje.
// Funções puras (só usam o relógio): testadas em testes/unitarios/datas.test.ts.

// Data AAAA-MM-DD de há N anos, mais (ou menos) alguns dias, a partir de hoje.
export function dataUtc(anos: number, dias = 0): string {
  const hoje = new Date();
  const data = new Date(Date.UTC(hoje.getUTCFullYear() - anos, hoje.getUTCMonth(), hoje.getUTCDate() + dias));
  return data.toISOString().slice(0, 10);
}

// Data de nascimento de quem faz ou fez N anos num dia relativo a hoje:
// "faz 18 anos hoje", "fez 18 anos ontem", "faz 18 anos amanhã".
// Num 29 de fevereiro, a data de há N anos pode não existir: o JavaScript passa-a
// para 1 de março (ver o teste unitário que documenta este caso).
export function dataDeNascimento(texto: string): string {
  const partes = texto.match(/^(faz|fez) (\d+) anos (hoje|ontem|amanhã)$/);
  if (!partes) {
    throw new Error(`Idade "${texto}" não reconhecida. Use, por exemplo, "faz 18 anos hoje" ou "fez 18 anos ontem".`);
  }
  const dias = { hoje: 0, ontem: -1, 'amanhã': 1 }[partes[3] as 'hoje' | 'ontem' | 'amanhã'];
  return dataUtc(Number(partes[2]), dias);
}

// Converte uma validade escrita no cenário no formato da API (MM/AAAA), a partir de hoje.
// Formas aceites: "este mês", "o mês passado" e "daqui a N anos".
export function validade(texto: string): string {
  const daquiA = texto.match(/^daqui a (\d+) anos?$/);
  let meses: number;
  if (texto === 'este mês') {
    meses = 0;
  } else if (texto === 'o mês passado') {
    meses = -1;
  } else if (daquiA) {
    meses = Number(daquiA[1]) * 12;
  } else {
    throw new Error(`Validade "${texto}" não reconhecida. Use "este mês", "o mês passado" ou "daqui a N anos".`);
  }
  // Conta em meses desde o ano 0, para não haver erros na passagem de ano (janeiro − 1 = dezembro do ano anterior).
  const hoje = new Date();
  const total = hoje.getUTCFullYear() * 12 + hoje.getUTCMonth() + meses;
  const mes = String((total % 12) + 1).padStart(2, '0');
  return `${mes}/${Math.floor(total / 12)}`;
}
