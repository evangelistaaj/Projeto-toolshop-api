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

// Cada perfil mostra o progresso no terminal e grava um relatório HTML em resultados/.
module.exports = {
  // Execução normal: rápida, sem bugs conhecidos nem cenários lentos.
  default: {
    ...comum,
    tags: soLocal('not @bug-conhecido and not @lento'),
    format: ['progress', 'html:resultados/relatorio.html'],
  },

  // Só os bugs conhecidos: para ver se já foram corrigidos.
  // O resumo das falhas fica também em texto (UTF-8), em resultados/bugs.txt.
  bugs: {
    ...comum,
    tags: soLocal('@bug-conhecido'),
    format: ['progress', 'summary:resultados/bugs.txt', 'html:resultados/bugs.html'],
  },

  // Só os cenários lentos (esperam por processos em segundo plano).
  lento: {
    ...comum,
    tags: soLocal('@lento and not @bug-conhecido'),
    format: ['progress', 'html:resultados/lento.html'],
  },
};
