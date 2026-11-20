// Endereço da API: o mesmo que os testes usam (support/hooks.ts).
const API_URL = process.env.API_URL ?? 'http://localhost:8091';

// Os cenários @so-local criam dados (produtos, carrinhos, compras) e só podem correr
// na Toolshop local. Com qualquer outro endereço (por exemplo, a API pública, que é
// partilhada), são excluídos automaticamente: a regra é garantida pela configuração.
const ehLocal = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/.test(API_URL);
const soLocal = (tags) => (ehLocal ? tags : `(${tags}) and not @so-local`);

// Configuração comum a todos os perfis.
const comum = {
  paths: ['features/**/*.feature'],
  requireModule: ['tsx/cjs'],
  require: ['steps/**/*.ts', 'support/**/*.ts'],
};

// O terminal usa um formatter próprio (support/formatador-limpo.cjs): um sinal por cenário
// e, no fim, cada falha num bloco curto, sem a pilha do node_modules. Cada perfil grava
// também um relatório HTML completo em resultados/.
const LIMPO = './support/formatador-limpo.cjs';

module.exports = {
  // Execução normal: rápida, sem bugs conhecidos nem cenários lentos.
  default: {
    ...comum,
    tags: soLocal('not @bug-conhecido and not @lento'),
    format: [LIMPO, 'html:resultados/relatorio.html'],
  },

  // Só os bugs conhecidos: para ver se já foram corrigidos.
  // O resumo das falhas fica também em texto (UTF-8), em resultados/bugs.txt.
  bugs: {
    ...comum,
    tags: soLocal('@bug-conhecido'),
    format: [LIMPO, `${LIMPO}:resultados/bugs.txt`, 'html:resultados/bugs.html'],
  },

  // Só os cenários lentos (esperam por processos em segundo plano).
  lento: {
    ...comum,
    tags: soLocal('@lento and not @bug-conhecido'),
    format: [LIMPO, 'html:resultados/lento.html'],
  },
};
